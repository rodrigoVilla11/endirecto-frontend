"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaShoppingCart } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import PrivateRoute from "../context/PrivateRoutes";
import ButtonOnOff from "../components/components/ButtonOnOff";
import { MdShoppingCart } from "react-icons/md";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import { useClient } from "../context/ClientContext";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetStockQuery } from "@/redux/services/stockApi";
import {
  useGetArticlePriceByArticleIdQuery,
  useGetArticlesPricesQuery,
} from "@/redux/services/articlesPricesApi";
import DeleteArticleComponent from "./DeleteArticle";
import Modal from "../components/components/Modal";

const Page = () => {
  const { selectedClientId } = useClient();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const [updateCustomer, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCustomerMutation();
  const { data, error, isLoading, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const {
    data: articles,
    error: errorArticles,
    isLoading: isLoadingArticles,
    refetch: refetchArticles,
  } = useGetAllArticlesQuery(null);

  const { data: stockData } = useGetStockQuery(null);

  const { data: brandData } = useGetBrandsQuery(null);

  const { data: articlePricesData } = useGetArticlesPricesQuery(null);

  const openDeleteModal = (id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentArticleId(encodedId);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentArticleId(null);
    refetch();
  };

  const articleCount = data?.shopping_cart.reduce(
    (acc: Record<string, number>, articleId: string) => {
      acc[articleId] = (acc[articleId] || 0) + 1;
      return acc;
    },
    {}
  );
  const uniqueArticleIds = Array.from(new Set(data?.shopping_cart));
  
  function formatNumber(num: number) {
    return num?.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  const handleUpdate = async (articleId: string, newQuantity: number) => {
    if (!data || !data.shopping_cart) return;

    try {
      // Crear una nueva lista de artículos con la cantidad actualizada
      let updatedShoppingCart = [...data.shopping_cart];

      // Encontrar el índice del primer artículo que coincida con articleId
      const index = updatedShoppingCart.findIndex((id) => id === articleId);

      if (index !== -1) {
        // Eliminar todas las instancias del artículo
        updatedShoppingCart = updatedShoppingCart.filter(
          (id) => id !== articleId
        );

        // Agregar el artículo la cantidad de veces especificada por newQuantity
        updatedShoppingCart.push(...Array(newQuantity).fill(articleId));
      }

      // Actualizar el cliente con el nuevo carrito de compras
      await updateCustomer({
        id: data.id,
        shopping_cart: updatedShoppingCart,
      });

      // Refrescar los datos del cliente
      refetch();
    } catch (err) {
      console.error("Error updating article quantity:", err);
    }
  };

  const tableData = uniqueArticleIds.map((articleId) => {
    const inSC = articles?.find((data) => data.id === articleId);
    const stock = stockData?.find((data) => data.article_id === inSC?.id);
    const articlePrice = articlePricesData?.find(
      (data) => data.article_id === inSC?.id
    );
    const brand = brandData?.find((data) => data.id === inSC?.brand_id);
    const quantity = (articleCount && articleCount[articleId]) || 1;
    const price = articlePrice ? articlePrice.price : 0;

    const formattedNumber = formatNumber(price);
    const totalPrice = price * quantity;
    const formattedTotal = formatNumber(totalPrice);

    return {
      key: inSC?.id,
      included: <ButtonOnOff title="" />,
      brand: brand?.name || "NO BRAND",
      image: inSC?.images, //PONER ARRAY
      name: inSC?.name,
      stock: stock?.quantity,
      price: `$ ${formattedNumber} + taxes`,
      quantity: (
        <div>
          <input
            type="number"
            value={quantity}
            className="w-20 text-center border rounded-md"
            min={1}
            onChange={(e) => {
              const newQuantity = Number(e.target.value);
              if (!isNaN(newQuantity) && newQuantity >= 1) {
                setQuantity(newQuantity);
                handleUpdate(articleId, newQuantity);
              }
            }}
          />
        </div>
      ),
      total: `$ ${formattedTotal} + taxes`,
      erase: (
        <FaTrashCan
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => openDeleteModal(inSC?.id || "")}
        />
      ),
    };
  });

  const tableHeader = [
    { name: "Included", key: "included" },
    { name: "Brand", key: "brand" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Article", key: "article" },
    { name: "Stock", key: "stock" },
    { name: "Price", key: "price" },
    { name: "Quantity", key: "quantity" },
    { name: "Total", key: "total" },

    {
      component: <FaTrashCan className="text-center text-xl" />,
      key: "trash-can",
    },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <FaTrashCan />,
        title: "Empty Cart",
        red: true,
      },
      {
        logo: <MdShoppingCart />,
        title: "Close Order",
      },
    ],
    filters: [
      {
        content: <ButtonOnOff title="Select All" />,
      },
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    secondSection: {
      title: "Total Without Taxes",
      amount: "000",
      total: "PEDIDO (1): $ 35.000",
    },
    results: "1 Results",
  };

  return (
    <PrivateRoute>
      <div className="gap-4">
        <h3 className="font-bold p-4">ShoppingCart</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteArticleComponent
            articleId={currentArticleId || ""}
            closeModal={closeDeleteModal}
            data={data}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
