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
import AddToCartComponent from "./AddToCart";

const Page = () => {
  const { selectedClientId } = useClient();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // Estado para almacenar el término de búsqueda
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

  // Filtrar los datos de la tabla en función del término de búsqueda
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
          brand: brand?.name || "NO BRAND",
          image: article?.images?.[0] || "No Image",
          name: article?.name || "Unknown Article",
          price: `$ ${formattedPrice} + taxes`,
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
              {stock?.status || "NOT FOUND"}
            </div>
          ),
          shoppingCart: (
            <div className="flex justify-center items-center">
            <FaShoppingCart
              className="text-center text-xl hover:cursor-pointer"
              onClick={() => openAddModal(article?.id || "")}
            /></div>
          ),
          erase: (
            <div className="flex justify-center items-center">
            <FaTrashCan
              className="text-center text-lg hover:cursor-pointer"
              onClick={() => openDeleteModal(article?.id || "")}
            /></div>
          ),
        };
      })
      .filter((item) => {
        // Filtro por nombre de artículo, marca o precio
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(lowerSearchTerm) ||
          item.brand.toLowerCase().includes(lowerSearchTerm) ||
          item.price.toLowerCase().includes(lowerSearchTerm)
        );
      });
  }, [customer, articles, stockData, articlePricesData, brandData, searchTerm]);

  const tableHeader = [
    { name: "Brand", key: "brand" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Article", key: "name" },
    { name: "Price", key: "price" },
    { name: "Stock", key: "stock" },
    {
      component: <FaShoppingCart className="text-center text-xl" />,
      key: "shopping-cart",
    },
    {
      component: <FaTrashCan className="text-center text-xl" />,
      key: "trash-can",
    },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <Input
            placeholder={"Search..."}
            value={searchTerm}
            onChange={(e : any) => setSearchTerm(e.target.value)} // Actualizar el estado con el valor del input
          />
        ),
      },
    ],
    results: `${filteredTableData.length} Results`,
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
    return <div>Error loading data</div>;
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR",
      "CUSTOMER"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">FAVOURITES</h3>
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
