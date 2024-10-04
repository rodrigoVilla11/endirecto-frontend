"use client";
import React, { useState, useMemo } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaShoppingCart } from "react-icons/fa";
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

interface Article {
  id: string;
  name: string;
  brand_id: string;
  images: string[];
}

interface Stock {
  article_id: string;
  quantity: number;
}

interface ArticlePrice {
  article_id: string;
  price: number;
}

interface Brand {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  shopping_cart: string[];
}

const Page: React.FC = () => {
  const { selectedClientId } = useClient();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const openDeleteModal = (id: string) => {
    setCurrentArticleId(encodeURIComponent(id));
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentArticleId(null);
    refetchCustomer();
  };

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
    } catch (err) {
      console.error("Error updating article quantity:", err);
    }
  };

  const filteredArticles = useMemo(() => {
    return uniqueArticleIds.filter((articleId) => {
      const article = articles?.find((data) => data.id === articleId);
      return article?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [articles, uniqueArticleIds, searchTerm]);

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

      return {
        key: article?.id,
        included: <ButtonOnOff title="" />,
        brand: brand?.name || "NO BRAND",
        image: article?.images?.[0] || "No Image",
        name: article?.name || "Unknown Article",
        stock: stock?.quantity || 0,
        price: `$ ${formattedPrice} + taxes`,
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
        total: `$ ${formattedTotal} + taxes`,
        erase: (
          <div className="flex justify-center items-center">
          <FaTrashCan
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openDeleteModal(article?.id || "")}
          /></div>
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
  ]);

  const tableHeader = [
    { name: "Included", key: "included" },
    { name: "Brand", key: "brand" },
    { component: <FaImage className="text-center text-xl" />, key: "image" },
    { name: "Article", key: "name" },
    { name: "Stock", key: "stock" },
    { name: "Price", key: "price" },
    { name: "Quantity", key: "quantity" },
    { name: "Total", key: "total" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  const handleEmptyCart = async () => {
    if (!customer) return;

    try {
      await updateCustomer({
        id: customer.id,
        shopping_cart: [],
      });
      refetchCustomer();
    } catch (err) {
      console.error("Error emptying the cart:", err);
    }
  };

  const headerBody = {
    buttons: [
      {
        logo: <FaTrashCan />,
        title: "Empty Cart",
        red: true,
        onClick: handleEmptyCart,
      },
      { logo: <MdShoppingCart />, title: "Close Order" },
    ],
    filters: [
      { content: <ButtonOnOff title="Select All" /> },
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
      amount: `$ ${formatNumber(
        tableData.reduce(
          (acc, item) => acc + parseFloat(item.total.split("$")[1]),
          0
        )
      )}`,
      total: `PEDIDO (${uniqueArticleIds.length}): $ ${formatNumber(
        tableData.reduce(
          (acc, item) => acc + parseFloat(item.total.split("$")[1]),
          0
        )
      )}`,
    },
    results: `${uniqueArticleIds.length} Results`,
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
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}>
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
      </div>
    </PrivateRoute>
  );
};

export default Page;
