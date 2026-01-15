"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  const { selectedClientId } = useClient();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [order, setOrder] = useState<OrderItem[]>([]);
  const { showPurchasePrice } = useFilters();
  const { isMobile } = useMobile();

  // 1. Fetch customer
  const { data: customer, refetch: refetchCustomer } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  // 2. Build unique cart IDs list
 const cartIds = useMemo(
  () => Array.from(new Set(customer?.shopping_cart || []))
    .map(id => encodeURIComponent(id)) // Encodear cada ID
    .join(";"),
  [customer?.shopping_cart]
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

  // Formateo de precio memoizado
  const formatPrice = useCallback((value: number) => 
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    })
      .format(value)
      .replace("ARS", "")
      .trim()
  , []);

  // Build cart items once data is ready
  useEffect(() => {
    if (!customer || isArticlesLoading || articles.length === 0 || !paymentsConditions || !articlesBonuses) {
      return;
    }

    const paymentCond = paymentsConditions.find(
      (p) => p.id === customer.payment_condition_id
    );
    const payPct = Math.abs(parseFloat(paymentCond?.percentage || "0"));

    const items: CartItem[] = [];
    const itemsMap = new Map<string, CartItem>();

    customer.shopping_cart.forEach((aid) => {
      const art = articles.find((a) => a.id === aid);
      if (!art) return;

      // Base price from summary
      let price = art.prices?.price || 0;
      const isOffer = art.prices?.offer != null;
      const bonus = articlesBonuses.find((b) => b.item_id === art.item_id);

      if (!isOffer && bonus?.percentage_1) {
        price -= (price * bonus.percentage_1) / 100;
      }
      // Apply payment surcharge
      price += (price * payPct) / 100;

      const existing = itemsMap.get(art.id);
      if (existing) {
        existing.quantity++;
      } else {
        const newItem: CartItem = {
          id: art.id,
          quantity: 1,
          price,
          name: art.name || "",
          brand: art.brand || "",
          stock: { 
            quantity: art.stock?.quantity || 0, 
            status: art.stock?.status || "UNKNOWN" 
          },
          percentage: bonus?.percentage_1 || 0,
          image: art.images?.[0],
          supplier_code: art.supplier_code,
        };
        itemsMap.set(art.id, newItem);
        items.push(newItem);
      }
    });

    setCartItems(items);
    setOrderItems((prev) =>
      items.map((item) => ({
        ...item,
        selected: prev.find((o) => o.id === item.id)?.selected ?? true,
      }))
    );
  }, [customer, articles, paymentsConditions, articlesBonuses, isArticlesLoading]);

  // Handlers optimizados con useCallback
  const handleQuantityChange = useCallback(async (id: string, qty: number) => {
    if (qty < 1 || !customer) return;
    
    // Actualización optimista del estado local
    const updateState = (prev: CartItem[]) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
    
    setCartItems(updateState);
    setOrderItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );

    // Construir carrito actualizado
    const updated = cartItems.flatMap((i) =>
      i.id === id ? Array(qty).fill(i.id) : Array(i.quantity).fill(i.id)
    );
    
    try {
      await updateCustomer({ id: customer.id, shopping_cart: updated });
      refetchCustomer();
    } catch (error) {
      // Revertir en caso de error
      console.error("Error updating cart:", error);
      refetchCustomer();
    }
  }, [customer, cartItems, updateCustomer, refetchCustomer]);

  const handleRemoveItem = useCallback(async (id: string) => {
    if (!customer) return;
    
    // Actualización optimista
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    setOrderItems((prev) => prev.filter((i) => i.id !== id));
    
    const updated = cartItems
      .filter((i) => i.id !== id)
      .flatMap((i) => Array(i.quantity).fill(i.id));
    
    try {
      await updateCustomer({ id: customer.id, shopping_cart: updated });
      refetchCustomer();
    } catch (error) {
      console.error("Error removing item:", error);
      refetchCustomer();
    }
  }, [customer, cartItems, updateCustomer, refetchCustomer]);

  const handleEmptyCart = useCallback(async () => {
    if (!customer) return;
    
    try {
      await updateCustomer({ id: customer.id, shopping_cart: [] });
      setCartItems([]);
      setOrderItems([]);
      setConfirmModalOpen(false);
      refetchCustomer();
    } catch (error) {
      console.error("Error emptying cart:", error);
    }
  }, [customer, updateCustomer, refetchCustomer]);

  const handleToggleSelect = useCallback((id: string) => {
    setOrderItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
    );
  }, []);

  const handleSelectAll = useCallback((sel: boolean) => {
    setOrderItems((prev) => prev.map((i) => ({ ...i, selected: sel })));
  }, []);

  const handleOpenArticleDetails = useCallback((id: string) => {
    setArticleId(id);
  }, [setArticleId]);

  const handleCloseArticleDetails = useCallback(() => {
    setArticleId("");
  }, [setArticleId]);

  // Filtrado memoizado
  const filteredItems = useMemo(() => {
    if (!searchTerm) return cartItems;
    
    const term = searchTerm.toLowerCase();
    return cartItems.filter((item) => {
      const matchName = item.name?.toLowerCase().includes(term);
      const matchSupplier = item.supplier_code?.toLowerCase().includes(term);
      const matchBrand = item.brand?.toLowerCase().includes(term);
      return matchName || matchSupplier || matchBrand;
    });
  }, [cartItems, searchTerm]);

  // Cálculos memoizados
  const { allSelected, selected, totalAmount, totalItems } = useMemo(() => {
    const allSel = orderItems.length > 0 && orderItems.every((i) => i.selected);
    const sel = orderItems.filter((i) => i.selected);
    const totAmount = sel.reduce((s, i) => s + i.price * i.quantity, 0);
    const totItems = sel.reduce((s, i) => s + i.quantity, 0);
    
    return {
      allSelected: allSel,
      selected: sel,
      totalAmount: totAmount,
      totalItems: totItems,
    };
  }, [orderItems]);

  // Table data memoizado
  const tableData = useMemo(() => 
    filteredItems.map((item) => {
      const oi = orderItems.find((o) => o.id === item.id);
      if (!oi) return null;
      
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
            onClick={() => handleOpenArticleDetails(item.id)}
          />
        ) : (
          "Sin imagen"
        ),
        name: (
          <div onClick={() => handleOpenArticleDetails(item.id)} className="cursor-pointer">
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
            className="w-16 text-center text-xs text-black rounded-md border border-gray-300 p-1"
            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        total: (
          <span className="text-xs">
            {formatPrice(item.price * item.quantity)}
          </span>
        ),
        erase: (
          <FaTrashCan
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveItem(item.id);
            }}
            className="cursor-pointer hover:text-red-600 transition-colors"
          />
        ),
      };
    }).filter(Boolean)
  , [filteredItems, orderItems, formatPrice, handleToggleSelect, handleOpenArticleDetails, handleQuantityChange, handleRemoveItem]);

  // Headers memoizados
  const tableHeaders = useMemo(() => [
    { name: "Incluir", key: "included" },
    { name: "Marca", key: "brand" },
    { component: <FaImage />, key: "image" },
    { name: "Artículo", key: "name" },
    { name: "Stock", key: "stock" },
    { name: "Precio", key: "price" },
    { name: "Cantidad", key: "quantity" },
    { name: "Total", key: "total" },
    { component: <FaTrashCan />, key: "erase" },
  ], []);

  // Header config memoizado
  const headerConfig = useMemo(() => ({
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
        disabled: selected.length === 0,
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
  }), [cartItems.length, selected, allSelected, handleSelectAll, searchTerm, formatPrice, totalAmount, totalItems, filteredItems.length]);

  // Show spinner while loading
  if (!customer || isArticlesLoading) {
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
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </PrivateRoute>
    );
  }

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
        <h3 className="font-bold text-lg text-white">Carrito de Compras</h3>
        <Header headerBody={headerConfig} />
        <div className="overflow-x-auto">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              El carrito está vacío
            </div>
          ) : (
            <Table headers={tableHeaders} data={tableData} />
          )}
        </div>

        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
        >
          <div className="p-4 bg-black text-white border border-red-600 rounded-lg shadow-lg">
            <h2 className="font-semibold ">Confirmar vaciado del carrito</h2>
            <p className="mt-2">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmptyCart}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
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

        {articleId && (
          <Modal isOpen={true} onClose={handleCloseArticleDetails}>
            <ArticleDetails
              closeModal={handleCloseArticleDetails}
              showPurchasePrice={showPurchasePrice}
            />
          </Modal>
        )}
      </div>
    </PrivateRoute>
  );
};

export default ShoppingCart;