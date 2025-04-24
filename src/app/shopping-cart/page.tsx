"use client";
import React, { useState, useEffect } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaTrashCan } from "react-icons/fa6";
import { MdShoppingCart } from "react-icons/md";
import PrivateRoute from "../context/PrivateRoutes";
import ButtonOnOff from "../components/components/ButtonOnOff";
import Modal from "../components/components/Modal";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import { useClient } from "../context/ClientContext";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetStockQuery } from "@/redux/services/stockApi";
import { useGetArticlesPricesQuery } from "@/redux/services/articlesPricesApi";
import OrderConfirmation from "./ModalOrder";
import { useGetArticlesBonusesQuery } from "@/redux/services/articlesBonusesApi";
import ArticleDetails from "../components/Catalogue/components/Articles/components/ArticleDetails";
import { useArticleId } from "../context/AritlceIdContext";
import { useGetPaymentConditionsQuery } from "@/redux/services/paymentConditionsApi";
import { useMobile } from "../context/ResponsiveContext";
import MobileTable from "../components/components/MobileTable";

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
  brand: string;
  stock: any;
  image?: string;
  supplier_code?: string;
  percentage: number;
}

interface OrderItem extends CartItem {
  selected: boolean;
}

const ShoppingCart = () => {
  const { articleId, setArticleId } = useArticleId();
  const [isModalOpen, setModalOpen] = useState(false);
  const { selectedClientId } = useClient();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [order, setOrder] = useState<OrderItem[]>([]);

  const { data: customer, refetch: refetchCustomer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const { data: articles } = useGetAllArticlesQuery(null);
  const { data: paymentsConditions } = useGetPaymentConditionsQuery(null);
  const { data: brands } = useGetBrandsQuery(null);
  const { data: stock } = useGetStockQuery(null);
  const { data: prices } = useGetArticlesPricesQuery(null);
  const [updateCustomer] = useUpdateCustomerMutation();
  const { data: articlesBonuses } = useGetArticlesBonusesQuery(null);
  const { isMobile } = useMobile();

  // Determinamos si ya se cargaron todos los datos necesarios
  const isAllDataLoaded =
    customer &&
    articles &&
    brands &&
    prices &&
    stock &&
    paymentsConditions &&
    articlesBonuses;

  // Inicializar carrito y orden (este useEffect se ejecuta siempre, pero si los datos aún no están cargados, no hará nada)
  useEffect(() => {
    if (!isAllDataLoaded) return;

    const items = customer.shopping_cart.reduce(
      (acc: CartItem[], articleId) => {
        const article = articles.find((a) => a.id === articleId);
        const brand = brands.find((b) => b.id === article?.brand_id);
        const paymentCondition = paymentsConditions.find(
          (p) => p.id === customer?.payment_condition_id
        );
        const percentagePaymentCondition = Math.abs(
          parseFloat(paymentCondition?.percentage || "0")
        );
        // Obtener el precio base
        const priceObj = prices.find(
          (p) =>
            p.article_id === articleId &&
            p.price_list_id === customer?.price_list_id
        );
        let price =
          priceObj?.offer !== null && priceObj?.offer !== undefined
            ? priceObj.offer
            : priceObj?.price || 0;
        // Aplicar bonus solo si NO es una oferta
        let discount = 0;
        const bonus = articlesBonuses.find(
          (b) => b.item_id === article?.item_id
        );
        if (priceObj?.offer === null || priceObj?.offer === undefined) {
          if (bonus?.percentage_1 && typeof price === "number") {
            discount = (price * bonus.percentage_1) / 100;
            price -= discount;
          }
        }
        // Aplicar recargo de la condición de pago
        if (percentagePaymentCondition && typeof price === "number") {
          const recharge = (price * percentagePaymentCondition) / 100;
          price += recharge;
        }
        const stockItem = stock.find((s) => s.article_id === articleId);
        const existingItem = acc.find((item) => item.id === articleId);
        if (existingItem) {
          existingItem.quantity += 1;
          return acc;
        }
        if (article) {
          acc.push({
            id: articleId,
            quantity: 1,
            price,
            name: article.name,
            brand: brand?.images || "Sin marca",
            stock: {
              quantity: stockItem?.quantity || 0,
              status: stockItem?.status,
            },
            percentage: bonus?.percentage_1 || 0,
            image: article.images?.[0],
            supplier_code: article.supplier_code,
          });
        }
        return acc;
      },
      []
    );
    setCartItems(items);
    setOrderItems((prevOrderItems) =>
      items.map((item) => {
        const prevItem = prevOrderItems.find(
          (orderItem) => orderItem.id === item.id
        );
        return { ...item, selected: prevItem ? prevItem.selected : true };
      })
    );
  }, [
    isAllDataLoaded,
    customer,
    articles,
    brands,
    prices,
    stock,
    articlesBonuses,
    paymentsConditions,
  ]);

  // Resto de funciones y handlers (handleQuantityChange, formatPriceWithCurrency, etc.)
  // ...
  // Por brevedad, se omiten en este ejemplo, pero se mantienen igual

  const handleQuantityChange = async (
    articleId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;
    try {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === articleId ? { ...item, quantity: newQuantity } : item
        )
      );
      setOrderItems((prevItems) =>
        prevItems.map((item) =>
          item.id === articleId ? { ...item, quantity: newQuantity } : item
        )
      );
      if (customer) {
        const updatedCart = cartItems.flatMap((item) =>
          item.id === articleId
            ? Array(newQuantity).fill(item.id)
            : Array(item.quantity).fill(item.id)
        );
        await updateCustomer({
          id: customer.id,
          shopping_cart: updatedCart,
        });
        refetchCustomer();
      }
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  function formatPriceWithCurrency(price: number): string {
    const formattedNumber = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(price)
      .replace("ARS", "")
      .trim();
    return `${formattedNumber}`;
  }

  const handleRemoveItem = async (articleId: string) => {
    try {
      setCartItems((prev) => prev.filter((item) => item.id !== articleId));
      setOrderItems((prev) => prev.filter((item) => item.id !== articleId));
      if (customer) {
        const updatedCart = cartItems
          .filter((item) => item.id !== articleId)
          .flatMap((item) => Array(item.quantity).fill(item.id));
        await updateCustomer({
          id: customer.id,
          shopping_cart: updatedCart,
        });
        refetchCustomer();
      }
    } catch (error) {
      console.error("Error al eliminar artículo:", error);
    }
  };

  const handleEmptyCart = async () => {
    try {
      if (customer) {
        await updateCustomer({
          id: customer.id,
          shopping_cart: [],
        });
        setCartItems([]);
        setOrderItems([]);
        setConfirmModalOpen(false);
        refetchCustomer();
      }
    } catch (error) {
      console.error("Error al vaciar carrito:", error);
    }
  };

  const handleToggleSelect = (articleId: string) => {
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.id === articleId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setOrderItems((prevItems) =>
      prevItems.map((item) => ({ ...item, selected }))
    );
  };

  const getSelectedItems = () => orderItems.filter((item) => item.selected);
  const totalAmount = orderItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = orderItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.quantity, 0);
  const filteredItems = cartItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const allSelected =
    orderItems.length > 0 && orderItems.every((item) => item.selected);

  const handleOpenModal = (id: string) => {
    setModalOpen(true);
    setArticleId(id);
  };

  // Preparar tableData y tableHeaders (igual que en tu código original)
  const tableData = filteredItems.map((item) => {
    const orderItem = orderItems.find((o) => o.id === item.id);
    return {
      key: item.id,
      included: (
        <ButtonOnOff
          title=""
          active={orderItem?.selected || false}
          onChange={() => handleToggleSelect(item.id)}
        />
      ),
      brand: item.brand ? (
        <img
          src={item.brand}
          alt={item.brand}
          className="h-12 w-12 md:h-16 md:w-16 object-contain rounded-md"
        />
      ) : (
        "Sin imagen"
      ),
      image: item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="h-12 w-12 md:h-16 md:w-16 object-contain rounded-md cursor-pointer"
          onClick={() => handleOpenModal(item.id)}
        />
      ) : (
        "Sin imagen"
      ),
      name: (
        <div
          className="flex flex-col md:flex-row gap-1 md:gap-2 cursor-pointer min-w-[150px]"
          onClick={() => handleOpenModal(item.id)}
        >
          <p className="font-bold text-xs">{item.supplier_code}</p>
          <p className="text-xs md:text-xs">{item.name}</p>
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
      price: (
        <span className="text-xs whitespace-nowrap">
          {formatPriceWithCurrency(item.price)} + taxes
        </span>
      ),
      quantity: (
        <input
          type="number"
          value={item.quantity}
          className="w-16 md:w-20 text-center border rounded-md text-xs p-1"
          min={1}
          onChange={(e) =>
            handleQuantityChange(item.id, parseInt(e.target.value))
          }
        />
      ),
      total: (
        <span className="text-xs whitespace-nowrap">
          {formatPriceWithCurrency(item.price * item.quantity)} + taxes
        </span>
      ),
      erase: (
        <FaTrashCan
          className="text-center text-base md:text-lg hover:cursor-pointer mx-auto"
          onClick={() => handleRemoveItem(item.id)}
        />
      ),
    };
  });

  const tableHeaders = [
    { name: "Incluir", key: "included", important: true },
    { name: "Marca", key: "brand" },
    { component: <FaImage className="text-center text-xl" />, key: "image" },
    { name: "Artículo", key: "name", important: true },
    { name: "Stock", key: "stock" },
    { name: "Precio", key: "price" },
    { name: "Cantidad", key: "quantity", important: true },
    { name: "Total", key: "total" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  const headerConfig = {
    buttons: [
      {
        logo: <FaTrashCan />,
        title: "Vaciar Carrito",
        red: true,
        disabled: !isAllDataLoaded || cartItems.length === 0,
        onClick: () => setConfirmModalOpen(true),
      },
      {
        logo: <MdShoppingCart />,
        title: isAllDataLoaded ? "Cerrar Pedido" : "Cargando...",
        disabled: !isAllDataLoaded || cartItems.length === 0,
        onClick: () => {
          if (!isAllDataLoaded || cartItems.length === 0) return;
          const selectedOrder = getSelectedItems();
          setOrder(selectedOrder);
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
        ),
      },
    ],
    secondSection: {
      title: "Total sin impuestos",
      amount: formatPriceWithCurrency(totalAmount),
      total: `PEDIDO (${totalItems}): $ ${formatPriceWithCurrency(
        totalAmount
      )}`,
    },
    results: `${filteredItems.length} Resultados`,
  };

  const closeModal = () => setModalOpen(false);

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
      <div className="gap-4 max-w-[100vw] overflow-x-hidden">
        <h3 className="font-bold p-4 text-lg md:text-xl">Carrito de Compras</h3>
        <div className="px-2 md:px-4">
          <Header headerBody={headerConfig} />
        </div>
        <div className="overflow-x-auto px-2 md:px-4">
          {!isAllDataLoaded ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : cartItems.length > 0 ? (
            isMobile ? (
              <MobileTable
                data={tableData}
                handleModalOpen={handleOpenModal}
                handleQuantityChange={handleQuantityChange}
                handleRemoveItem={handleRemoveItem}
              />
            ) : (
              <Table headers={tableHeaders} data={tableData} />
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              El carrito está vacío
            </div>
          )}
        </div>

        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
        >
          <div className="p-4 md:p-6 w-[90vw] max-w-md mx-auto">
            <h2 className="text-base md:text-lg font-semibold">
              Confirmar vaciado del carrito
            </h2>
            <p className="mt-4 text-sm md:text-base">
              ¿Estás seguro de que deseas vaciar el carrito? Esta acción no se
              puede deshacer.
            </p>
            <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-4 mt-6">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="w-full md:w-auto bg-gray-400 text-white px-4 py-2 rounded-md text-sm md:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmptyCart}
                className="w-full md:w-auto bg-red-500 text-white px-4 py-2 rounded-md text-sm md:text-base"
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
          <div className="w-[90vw] max-w-xl mx-auto">
            <OrderConfirmation
              total={totalAmount}
              totalFormatted={formatPriceWithCurrency(totalAmount)}
              itemCount={totalItems}
              onCancel={() => setShowConfirmation(false)}
              order={order}
            />
          </div>
        </Modal>
        <Modal isOpen={isModalOpen} onClose={closeModal}>
          <div className="w-[90vw] md:w-auto max-w-2xl mx-auto">
            <ArticleDetails closeModal={closeModal} />
          </div>
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default ShoppingCart;
