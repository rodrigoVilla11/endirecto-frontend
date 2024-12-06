"use client";
import React, { useState, useMemo, useEffect } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa";
import { MdShoppingCart } from "react-icons/md";
import PrivateRoute from "../context/PrivateRoutes";
import ButtonOnOff from "../components/components/ButtonOnOff";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import { useClient } from "../context/ClientContext";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetStockQuery } from "@/redux/services/stockApi";
import { useGetArticlesPricesQuery } from "@/redux/services/articlesPricesApi";
import DeleteArticleComponent from "./DeleteArticle";
import Modal from "../components/components/Modal";
import { FaTrashCan } from "react-icons/fa6";


const Page: React.FC = () => {
  const { selectedClientId } = useClient();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [order, setOrder] = useState<
    { id: string; quantity: number; price: number; total: number }[]
  >([]);``

  const [updateCustomer] = useUpdateCustomerMutation();
  const {
    data: customer,
    error: customerError,
    isLoading: isCustomerLoading,
    refetch: refetchCustomer,
  } = useGetCustomerByIdQuery({ id: selectedClientId || "" });
  const {
    data: articles,
    error: articlesError,
    isLoading: isArticlesLoading,
  } = useGetAllArticlesQuery(null);
  const { data: stockData, error: stockError } = useGetStockQuery(null);
  const { data: brandData, error: brandError } = useGetBrandsQuery(null);
  const { data: articlePricesData, error: pricesError } =
    useGetArticlesPricesQuery(null);

    const articleCount = useMemo(() => {
      return (
        customer?.shopping_cart.reduce<Record<string, number>>(
          (acc, articleId) => {
            acc[articleId] = (acc[articleId] || 0) + 1;
            return acc;
          },
          {}
        ) || {}
      );
    }, [customer?.shopping_cart]);

    useEffect(() => {
      if (customer) {
        const initialOrder = customer.shopping_cart.map((articleId) => {
          const article = articles?.find((data) => data.id === articleId);
          const quantity = articleCount[articleId] || 1;
          const price =
            articlePricesData?.find((data) => data.article_id === articleId)
              ?.price || 0;
          const total = price * quantity;
  
          return { id: articleId, quantity, price, total };
        });
  
        setOrder(initialOrder); // Establecer el pedido con todos los artículos incluidos
      }
    }, [customer, articles, articlePricesData, articleCount]);
  
  

    
  const openDeleteModal = (id: string) => {
    setCurrentArticleId(encodeURIComponent(id));
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentArticleId(null);
    refetchCustomer();
  };

  const openConfirmModal = () => setConfirmModalOpen(true);
  const closeConfirmModal = () => setConfirmModalOpen(false);

  const handleEmptyCart = async () => {
    if (!customer) return;

    try {
      await updateCustomer({
        id: customer.id,
        shopping_cart: [],
      });
      refetchCustomer();
      closeConfirmModal();
      setOrder([]); // Vaciar el array 'order' también
    } catch (err) {
      console.error("Error emptying the cart:", err);
    }
  };


  const uniqueArticleIds = useMemo(
    () => Array.from(new Set(customer?.shopping_cart)),
    [customer?.shopping_cart]
  );

  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleUpdate = async (articleId: string, newQuantity: number) => {
    if (!customer) return;

    try {
      const updatedShoppingCart = customer.shopping_cart.filter(
        (id) => id !== articleId
      );
      updatedShoppingCart.push(...Array(newQuantity).fill(articleId));

      await updateCustomer({
        id: customer.id,
        shopping_cart: updatedShoppingCart,
      });

      refetchCustomer();

      // Actualizar cantidad y total en 'order' si el artículo está incluido
      setOrder((prevOrder) =>
        prevOrder.map((item) => {
          if (item.id === articleId) {
            const newTotal = item.price * newQuantity;
            return { ...item, quantity: newQuantity, total: newTotal };
          }
          return item;
        })
      );
    } catch (err) {
      console.error("Error updating article quantity:", err);
    }
  };

  const filteredArticles = useMemo(() => {
    const result = uniqueArticleIds.filter((articleId) => {
        const article = articles?.find((data) => data.id === articleId);
        return article?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    console.log("Filtered Articles:", result); // Ver cuántos artículos hay
    return result;
}, [articles, uniqueArticleIds, searchTerm]);


const handleIncludeToggle = (articleId: string, included: boolean) => {
  const article = articles?.find((data) => data.id === articleId);
  if (!article) return;

  const quantity = articleCount[articleId] || 1;
  const price =
    articlePricesData?.find((data) => data.article_id === articleId)?.price ||
    0;
  const total = price * quantity;

  setOrder((prevOrder) => {
    if (included) {
      // Verificar si el artículo ya está en 'order'
      const existingItem = prevOrder.find((item) => item.id === articleId);
      if (existingItem) {
        // Actualizar cantidad y total
        return prevOrder.map((item) =>
          item.id === articleId ? { ...item, quantity, total } : item
        );
      } else {
        // Agregar nuevo artículo
        return [...prevOrder, { id: articleId, quantity, price, total }];
      }
    } else {
      // Eliminar artículo de 'order'
      return prevOrder.filter((item) => item.id !== articleId);
    }
  });
};


  const totalPedido = order.reduce((acc, item) => acc + item.total, 0);
  const cantidadObjetos = order.reduce((acc, item) => acc + item.quantity, 0); // Sumar cantidades

  const tableData = useMemo(() => {
    return filteredArticles.map((articleId) => {
      const article = articles?.find((data) => data.id === articleId);
      const stock = stockData?.find((data) => data.article_id === article?.id);
      const articlePrice = articlePricesData?.find(
        (data) => data.article_id === article?.id
      );
      const brand = brandData?.find((data) => data.id === article?.brand_id);
      const quantity = articleCount[articleId] || 1;
      const price = articlePrice?.price || 0;

      const formattedPrice = formatNumber(price);
      const totalPrice = price * quantity;
      const formattedTotal = formatNumber(totalPrice);

      const isIncluded = order.some((item) => item.id === articleId);

      return {
        key: article?.id,
        included: (
          <ButtonOnOff
            title=""
            active={isIncluded}
            onChange={(newValue: boolean) =>
              handleIncludeToggle(articleId, newValue)
            }
          />
        ),
        brand: brand?.name || "NO BRAND",
        image: article?.images?.[0] ? (
          <img
            src={article.images[0]}
            alt={article.name || "Article Image"}
            className="h-16 w-16 object-contain rounded-md"
          />
        ) : (
          "No Image"
        ),
        name: article?.name || "Unknown Article",
        stock: stock?.quantity || 0,
        price: `$ ${formattedPrice} + impuestos`,
        quantity: (
          <input
            type="number"
            value={quantity}
            className="w-20 text-center border rounded-md"
            min={1}
            onChange={(e) => {
              const newQuantity = Number(e.target.value);
              if (!isNaN(newQuantity) && newQuantity >= 1) {
                handleUpdate(articleId, newQuantity);
              }
            }}
          />
        ),
        total: `$ ${formattedTotal} + impuestos`,
        erase: (
          <div className="flex justify-center items-center">
            <FaTrashCan
              className="text-center text-lg hover:cursor-pointer"
              onClick={() => openDeleteModal(article?.id || "")}
            />
          </div>
        ),
      };
    });
  }, [
    filteredArticles,
    articles,
    stockData,
    articlePricesData,
    brandData,
    articleCount,
    order,
  ]);

  const tableHeader = [
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

  const headerBody = {
    buttons: [
      {
        logo: <FaTrashCan />,
        title: "Empty Cart",
        red: true,
        onClick: openConfirmModal,
      },
      { logo: <MdShoppingCart />, title: "Close Order" },
    ],
    filters: [
      {
        content: (
          <ButtonOnOff
            title="Select All"
            active={order.length === filteredArticles.length}
            onChange={(checked: boolean) => {
              if (checked) {
                const newOrder = filteredArticles.map((articleId) => {
                  const article = articles?.find(
                    (data) => data.id === articleId
                  );
                  const price =
                    articlePricesData?.find(
                      (data) => data.article_id === articleId
                    )?.price || 0;
                  const quantity = articleCount[articleId] || 1;
                  const total = price * quantity;

                  return { id: articleId, quantity, price, total };
                });
                setOrder(newOrder);
              } else {
                setOrder([]);
              }
            }}
          />
        ),
      },
      {
        content: (
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
          />
        ),
      },
    ],
    secondSection: {
      title: "Total Without Taxes",
      amount: `$ ${formatNumber(totalPedido)}`,
      total: `PEDIDO (${cantidadObjetos}): $ ${formatNumber(totalPedido)}`,
    },
    results: `${filteredArticles.length} Results`,
  };

  if (isCustomerLoading || isArticlesLoading) {
    return <div>Loading...</div>;
  }

  if (
    customerError ||
    articlesError ||
    stockError ||
    brandError ||
    pricesError
  ) {
    return <div>Error loading data. Please try again later.</div>;
  }

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">Shopping Cart</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteArticleComponent
            articleId={currentArticleId || ""}
            closeModal={closeDeleteModal}
            data={customer}
          />
        </Modal>

        {/* Modal para confirmar vaciar carrito */}
        <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal}>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Confirm Empty Cart</h2>
            <p className="mt-4">
              Are you sure you want to empty the cart? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={closeConfirmModal}
                className="bg-gray-400 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyCart}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
