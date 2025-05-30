"use client";
import React, { useState, useEffect, useMemo } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaTrashCan } from "react-icons/fa6";
import { MdShoppingCart } from "react-icons/md";
import PrivateRoute from "../context/PrivateRoutes";
import ButtonOnOff from "../components/components/ButtonOnOff";
import Modal from "../components/components/Modal";
import OrderConfirmation from "./ModalOrder";
import ArticleDetails from "../components/Catalogue/components/Articles/components/ArticleDetails";
import { useClient } from "../context/ClientContext";
import { useArticleId } from "../context/AritlceIdContext";
import { useMobile } from "../context/ResponsiveContext";
import { useFilters } from "../context/FiltersContext";

import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useGetPaymentConditionsQuery } from "@/redux/services/paymentConditionsApi";
import { useGetArticlesBonusesQuery } from "@/redux/services/articlesBonusesApi";

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
  brand: string;
  stock: { quantity: number; status?: string };
  image?: string;
  supplier_code?: string;
  percentage: number;
}

interface OrderItem extends CartItem {
  selected: boolean;
}

const ShoppingCart: React.FC = () => {
  const { articleId, setArticleId } = useArticleId();
  const [isModalOpen, setModalOpen] = useState(false);
  const { selectedClientId } = useClient();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [order, setOrder] = useState<OrderItem[]>([]);
  const { showPurchasePrice } = useFilters();

  // 1. Fetch customer
  const { data: customer, refetch: refetchCustomer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  // 2. Build unique cart IDs list
  const cartIds = useMemo(
    () => Array.from(new Set(customer?.shopping_cart || [])).join(","),
    [customer]
  );

  // 3. Fetch only the cart's articles in summary mode
  const { data: articlesResponse, isFetching: isArticlesLoading } =
    useGetArticlesQuery(
      {
        priceListId: customer?.price_list_id || "",
        page: 1,
        limit: cartIds ? cartIds.split(",").length : 1,
        articleId: cartIds,
        summary: true,
      },
      { skip: !cartIds || !customer }
    );
  const articles = articlesResponse?.articles || [];

  // 4. Fetch payment conditions and bonuses
  const { data: paymentsConditions } = useGetPaymentConditionsQuery(null);
  const { data: articlesBonuses } = useGetArticlesBonusesQuery(null);

  const [updateCustomer] = useUpdateCustomerMutation();
  const { isMobile } = useMobile();

  // Determine if all data is loaded
  const isAllDataLoaded =
    customer &&
    !isArticlesLoading &&
    articles.length > 0 &&
    paymentsConditions &&
    articlesBonuses;

    console.log(articles)
  // Build cart items once data is ready
  useEffect(() => {
    if (!isAllDataLoaded) return;

    const paymentCond = paymentsConditions.find(
      (p) => p.id === customer.payment_condition_id
    );
    const payPct = Math.abs(parseFloat(paymentCond?.percentage || "0"));

    const items: CartItem[] = [];

    customer.shopping_cart.forEach((aid) => {
      const art = articles.find((a) => a.id === aid);
      if (!art) return;

      // Base price from summary
      let price = art.prices.price;
      const isOffer = art.prices.offer != null;
      const bonus = articlesBonuses.find((b) => b.item_id === art.item.id);

      if (!isOffer && bonus?.percentage_1) {
        price -= (art.prices.price * bonus.percentage_1) / 100;
      }
      // Apply payment surcharge
      price += (price * payPct) / 100;

      const existing = items.find((i) => i.id === art.id);
      if (existing) {
        existing.quantity++;
      } else {
        items.push({
          id: art.id,
          quantity: 1,
          price,
          name: art.name,
          brand: art.brand.name,
          stock: { quantity: art.stock.quantity, status: art.stock.status },
          percentage: bonus?.percentage_1 || 0,
          image: art.images?.[0],
          supplier_code: art.supplier_code,
        });
      }
    });

    setCartItems(items);
    setOrderItems((prev) =>
      items.map((item) => ({
        ...item,
        selected: prev.find((o) => o.id === item.id)?.selected ?? true,
      }))
    );
  }, [
    isAllDataLoaded,
    customer,
    articles,
    paymentsConditions,
    articlesBonuses,
  ]);

  // Show spinner while loading articles
  if (isArticlesLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Handlers (quantity change, remove, empty, toggle, etc.)
  const handleQuantityChange = async (id: string, qty: number) => {
    if (qty < 1) return;
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
    setOrderItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
    if (!customer) return;
    const updated = cartItems.flatMap((i) =>
      i.id === id ? Array(qty).fill(i.id) : Array(i.quantity).fill(i.id)
    );
    await updateCustomer({ id: customer.id, shopping_cart: updated });
    refetchCustomer();
  };

  const handleRemoveItem = async (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    setOrderItems((prev) => prev.filter((i) => i.id !== id));
    if (!customer) return;
    const updated = cartItems
      .filter((i) => i.id !== id)
      .flatMap((i) => Array(i.quantity).fill(i.id));
    await updateCustomer({ id: customer.id, shopping_cart: updated });
    refetchCustomer();
  };

  const handleEmptyCart = async () => {
    if (!customer) return;
    await updateCustomer({ id: customer.id, shopping_cart: [] });
    setCartItems([]);
    setOrderItems([]);
    setConfirmModalOpen(false);
    refetchCustomer();
  };

  const handleToggleSelect = (id: string) =>
    setOrderItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
    );

  const handleSelectAll = (sel: boolean) =>
    setOrderItems((prev) => prev.map((i) => ({ ...i, selected: sel })));

  // Formatting and totals
  const formatPrice = (v: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    })
      .format(v)
      .replace("ARS", "")
      .trim();

  const filteredItems = cartItems.filter(i => {
  const term = searchTerm.toLowerCase()

  const matchName = i.name?.toLowerCase().includes(term)
  const matchSupplier = i.supplier_code
    ? i.supplier_code.toLowerCase().includes(term)
    : false
  const matchBrand = i.brand
    ? i.brand.toLowerCase().includes(term)
    : false

  return matchName || matchSupplier || matchBrand
})

  const allSelected = orderItems.every((i) => i.selected);
  const selected = orderItems.filter((i) => i.selected);
  const totalAmount = selected.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = selected.reduce((s, i) => s + i.quantity, 0);

  // Table data & headers
  const tableData = filteredItems.map((item) => {
    const oi = orderItems.find((o) => o.id === item.id)!;
    return {
      key: item.id,
      included: (
        <ButtonOnOff
          title=""
          active={oi.selected}
          onChange={() => handleToggleSelect(item.id)}
        />
      ),
      brand: item.brand,
      image: item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="h-12 w-12 object-contain rounded-md cursor-pointer"
          onClick={() => setArticleId(item.id)}
        />
      ) : (
        "Sin imagen"
      ),
      name: (
        <div onClick={() => setArticleId(item.id)} className="cursor-pointer">
          <p className="font-bold text-xs">{item.supplier_code}</p>
          <p className="text-xs">{item.name}</p>
        </div>
      ),
      stock: (
        <div
          className={`${
            item.stock.status === "STOCK"
              ? "bg-success"
              : item.stock.status === "NO-STOCK"
              ? "bg-red-600"
              : item.stock.status === "LOW-STOCK"
              ? "bg-orange-600"
              : "bg-gray-500"
          } font-bold text-white text-center p-1 rounded-lg text-xs whitespace-nowrap`}
        >
          <p>{item.stock.status}</p>
        </div>
      ),
      price: <span className="text-xs">{formatPrice(item.price)}</span>,
      quantity: (
        <input
          type="number"
          value={item.quantity}
          min={1}
          className="w-16 text-center text-xs"
          onChange={(e) => handleQuantityChange(item.id, +e.target.value)}
        />
      ),
      total: (
        <span className="text-xs">
          {formatPrice(item.price * item.quantity)}
        </span>
      ),
      erase: (
        <FaTrashCan
          onClick={() => handleRemoveItem(item.id)}
          className="cursor-pointer"
        />
      ),
    };
  });

  const tableHeaders = [
    { name: "Incluir", key: "included" },
    { name: "Marca", key: "brand" },
    { component: <FaImage />, key: "image" },
    { name: "Artículo", key: "name" },
    { name: "Stock", key: "stock" },
    { name: "Precio", key: "price" },
    { name: "Cantidad", key: "quantity" },
    { name: "Total", key: "total" },
    { component: <FaTrashCan />, key: "erase" },
  ];

  const headerConfig = {
    buttons: [
      {
        logo: <FaTrashCan />,
        title: "Vaciar Carrito",
        red: true,
        disabled: cartItems.length === 0,
        onClick: () => setConfirmModalOpen(true),
      },
      {
        logo: <MdShoppingCart />,
        title: "Cerrar Pedido",
        disabled: cartItems.length === 0,
        onClick: () => {
          setOrder(selected);
          setShowConfirmation(true);
        },
      },
    ],
    filters: [
      {
        content: (
          <ButtonOnOff
            title="Seleccionar Todo"
            active={allSelected}
            onChange={handleSelectAll}
          />
        ),
      },
      {
        content: (
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
          />
        ),
      },
    ],
    secondSection: {
      title: "Total sin impuestos",
      amount: formatPrice(totalAmount),
      total: `PEDIDO (${totalItems}): ${formatPrice(totalAmount)}`,
    },
    results: `${filteredItems.length} Resultados`,
  };

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="p-4">
        <h3 className="font-bold text-lg">Carrito de Compras</h3>
        <Header headerBody={headerConfig} />
        <div className="overflow-x-auto">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              El carrito está vacío
            </div>
          ) : isMobile ? (
            <Table headers={tableHeaders} data={tableData} />
          ) : (
            <Table headers={tableHeaders} data={tableData} />
          )}
        </div>

        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
        >
          <div className="p-4">
            <h2 className="font-semibold">Confirmar vaciado del carrito</h2>
            <p className="mt-2">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmptyCart}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
        >
          <OrderConfirmation
            total={totalAmount}
            totalFormatted={formatPrice(totalAmount)}
            itemCount={totalItems}
            onCancel={() => setShowConfirmation(false)}
            order={order}
          />
        </Modal>

        <Modal isOpen={Boolean(articleId)} onClose={() => setArticleId("")}>
          <ArticleDetails
            closeModal={() => setArticleId("")}
            showPurchasePrice={showPurchasePrice}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default ShoppingCart;
