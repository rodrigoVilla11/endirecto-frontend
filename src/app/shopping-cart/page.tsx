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
import { customersBrandsApi } from "@/redux/services/customersBrandsApi";
import OrderConfirmation from "./ModalOrder";

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
  brand: string;
  stock: any;
  image?: string;
}

interface OrderItem extends CartItem {
  selected: boolean;
}

const ShoppingCart = () => {
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
  const { data: brands } = useGetBrandsQuery(null);
  const { data: stock } = useGetStockQuery(null);
  const { data: prices } = useGetArticlesPricesQuery(null);
  const [updateCustomer] = useUpdateCustomerMutation();

  // Inicializar carrito y orden
  useEffect(() => {
    if (!customer || !articles || !brands || !prices || !stock) return;

    const items = customer.shopping_cart.reduce(
      (acc: CartItem[], articleId) => {
        const article = articles.find((a) => a.id === articleId);

        const brand = brands.find((b) => b.id === article?.brand_id);
        const price =
        prices.find(
          (p) => p.article_id === articleId && p.price_list_id === customer?.price_list_id
        )?.price || 0;
      
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
            brand: brand?.name || "Sin marca",
            stock: stockItem?.quantity || 0,
            image: article.images?.[0],
          });
        }

        return acc;
      },
      []
    );

    setCartItems(items);
    // Inicializar orderItems con todos los items del carrito pero no seleccionados
    setOrderItems(items.map((item) => ({ ...item, selected: true })));
  }, [customer, articles, brands, prices, stock]);

  const handleQuantityChange = async (
    articleId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;

    try {
      // Actualizar cantidad en el carrito
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === articleId ? { ...item, quantity: newQuantity } : item
        )
      );

      // Actualizar cantidad en la orden
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
      .replace("ARS", "") // Elimina "ARS" del formato.
      .trim(); // Elimina espacios extra.

    return `${formattedNumber}`; // Agrega el símbolo "$" con espacio al principio.
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

  // Manejador para toggle de selección individual
  const handleToggleSelect = (articleId: string) => {
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.id === articleId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Manejador para select all
  const handleSelectAll = (selected: boolean) => {
    setOrderItems((prevItems) =>
      prevItems.map((item) => ({ ...item, selected }))
    );
  };

  // Obtener solo los items seleccionados para la orden
  const getSelectedItems = () => {
    return orderItems.filter((item) => item.selected);
  };

  // Calcular totales solo de items seleccionados
  const totalAmount = orderItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const totalItems = orderItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems = cartItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar si todos los items están seleccionados
  const allSelected =
    orderItems.length > 0 && orderItems.every((item) => item.selected);

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
      brand: item.brand,
      image: item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="h-16 w-16 object-contain rounded-md"
        />
      ) : (
        "Sin imagen"
      ),
      name: item.name,
      stock: item.stock,
      price: formatPriceWithCurrency(item.price),
      quantity: (
        <input
          type="number"
          value={item.quantity}
          className="w-20 text-center border rounded-md"
          min={1}
          onChange={(e) =>
            handleQuantityChange(item.id, parseInt(e.target.value))
          }
        />
      ),
      total: formatPriceWithCurrency(item.price * item.quantity),
      erase: (
        <FaTrashCan
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => handleRemoveItem(item.id)}
        />
      ),
    };
  });

  const tableHeaders = [
    { name: "Incluir", key: "included" },
    { name: "Marca", key: "brand" },
    { component: <FaImage className="text-center text-xl" />, key: "image" },
    { name: "Artículo", key: "name" },
    { name: "Stock", key: "stock" },
    { name: "Precio", key: "price" },
    { name: "Cantidad", key: "quantity" },
    { name: "Total", key: "total" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  const headerConfig = {
    buttons: [
      {
        logo: <FaTrashCan />,
        title: "Vaciar Carrito",
        red: true,
        onClick: () => setConfirmModalOpen(true),
      },
      {
        logo: <MdShoppingCart />,
        title: "Cerrar Pedido",
        onClick: () => {
          const selectedOrder = getSelectedItems();
          setOrder(selectedOrder)
          console.log("Orden a enviar:", selectedOrder);
          setShowConfirmation(true)
          // Aquí puedes agregar la lógica para procesar la orden
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

  console.log(tableData)
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
      <div className="gap-4">
        <h3 className="font-bold p-4">Carrito de Compras</h3>
        <Header headerBody={headerConfig} />

        {cartItems.length > 0 ? (
          <Table headers={tableHeaders} data={tableData} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            El carrito está vacío
          </div>
        )}

        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold">
              Confirmar vaciado del carrito
            </h2>
            <p className="mt-4">
              ¿Estás seguro de que deseas vaciar el carrito? Esta acción no se
              puede deshacer.
            </p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmptyCart}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
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
            totalFormatted={formatPriceWithCurrency(totalAmount)}
            itemCount={totalItems}
            onCancel={() => setShowConfirmation(false)}
            order={order}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default ShoppingCart;
