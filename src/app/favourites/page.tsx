"use client";
import React, { useMemo, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaShoppingCart } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import PrivateRoute from "../context/PrivateRoutes";
import { useClient } from "../context/ClientContext";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import { useGetStockQuery } from "@/redux/services/stockApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetArticlesPricesQuery } from "@/redux/services/articlesPricesApi";
import Modal from "../components/components/Modal";
import DeleteArticleComponent from "./DeleteArticleComponent";
import { useTranslation } from "react-i18next";
import AddToCartComponent from "./AddToCart";

const Page = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // Término de búsqueda

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

  const openAddModal = (id: string) => {
    setCurrentArticleId(encodeURIComponent(id));
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setCurrentArticleId(null);
    refetchCustomer();
  };

  const openDeleteModal = (id: string) => {
    setCurrentArticleId(encodeURIComponent(id));
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentArticleId(null);
    refetchCustomer();
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filtrar los datos de la tabla según el término de búsqueda
  const filteredTableData = useMemo(() => {
    if (
      !customer ||
      !articles ||
      !stockData ||
      !articlePricesData ||
      !brandData
    )
      return [];

    return customer.favourites
      .map((articleId) => {
        const article = articles.find((data) => data.id === articleId);
        const stock = stockData.find((data) => data.article_id === article?.id);
        const articlePrice = articlePricesData.find(
          (data) => data.article_id === article?.id
        );
        const brand = brandData.find((data) => data.id === article?.brand_id);
        const price = articlePrice?.price || 0;
        const formattedPrice = formatNumber(price);

        return {
          key: article?.id,
          brand: brand?.name || t("table.noBrand"),
          image: (
            <div className="flex justify-center items-center">
              {article?.images?.[0] ? (
                <img
                  src={article.images[0]}
                  alt={article.name}
                  className="h-10 w-10 object-cover"
                />
              ) : (
                t("table.noImage")
              )}
            </div>
          ),
          name: article?.name || t("table.unknownArticle"),
          price: `$ ${formattedPrice} ${t("table.plusTaxes")}`,
          stock: (
            <div
              className={`h-4 w-full ${
                stock?.status === "IN-STOCK"
                  ? "bg-success"
                  : stock?.status === "NO-STOCK"
                  ? "bg-red-600"
                  : stock?.status === "LIMITED-STOCK"
                  ? "bg-orange-600"
                  : "bg-gray-500"
              } font-bold text-white flex justify-center items-center`}
            >
              {stock?.status || t("table.notFound")}
            </div>
          ),
          shoppingCart: (
            <div className="flex justify-center items-center">
              <FaShoppingCart
                className="text-center text-xl hover:cursor-pointer"
                onClick={() => openAddModal(article?.id || "")}
              />
            </div>
          ),
          erase: (
            <div className="flex justify-center items-center">
              <FaTrashCan
                className="text-center text-lg hover:cursor-pointer"
                onClick={() => openDeleteModal(article?.id || "")}
              />
            </div>
          ),
        };
      })
      .filter((item) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(lowerSearchTerm) ||
          item.brand.toLowerCase().includes(lowerSearchTerm) ||
          item.price.toLowerCase().includes(lowerSearchTerm)
        );
      });
  }, [customer, articles, stockData, articlePricesData, brandData, searchTerm, t]);

  const tableHeader = [
    { name: t("table.brand"), key: "brand" },
    { component: <FaImage className="text-center text-xl" />, key: "image" },
    { name: t("table.article"), key: "name" },
    { name: t("table.price"), key: "price" },
    { name: t("table.stock"), key: "stock" },
    { component: <FaShoppingCart className="text-center text-xl" />, key: "shoppingCart" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <Input
            placeholder={t("page.searchPlaceholder")}
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
          />
        ),
      },
    ],
    results: t("page.results", { count: filteredTableData.length }),
  };

  if (isCustomerLoading || isArticlesLoading) {
    return <div>{t("page.loading")}</div>;
  }

  if (
    customerError ||
    articlesError ||
    stockError ||
    brandError ||
    pricesError
  ) {
    return <div>{t("page.errorLoadingData")}</div>;
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
      <div className="gap-4">
        <h3 className="font-bold p-4 text-white">{t("page.favouritesTitle")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={filteredTableData} />
        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteArticleComponent
            articleId={currentArticleId || ""}
            closeModal={closeDeleteModal}
            data={customer}
          />
        </Modal>
        <Modal isOpen={isAddModalOpen} onClose={closeAddModal}>
          <AddToCartComponent
            articleId={currentArticleId || ""}
            closeModal={closeAddModal}
            customer={customer}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
