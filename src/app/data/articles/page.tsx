"use client";
import React, { useState, useEffect, useRef } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil, FaTrashCan } from "react-icons/fa6";
import { AiOutlineDownload } from "react-icons/ai";
import { FaRegFilePdf } from "react-icons/fa";
import {
  useCountArticlesQuery,
  useGetArticlesQuery,
} from "@/redux/services/articlesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetItemsQuery } from "@/redux/services/itemsApi";
import Modal from "@/app/components/components/Modal";
import UpdateArticleComponent from "./UpdateArticle";
import DeleteArticleComponent from "./DeleteArticle";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data: brandData } = useGetBrandsQuery(null);
  const { data: itemData } = useGetItemsQuery(null);
  const { data: countArticlesData } = useCountArticlesQuery({
    query: searchQuery,
  });
  const { data, error, isLoading, refetch } = useGetArticlesQuery({
    page,
    limit,
    query: searchQuery,
  });

  // Cargar más artículos cuando cambia la página
  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const newArticles = result.data || []; // Garantiza que siempre sea un array
          setArticles((prev) => [...prev, ...newArticles]);
        })
        .catch((error) => {
          console.error("Error fetching articles:", error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [page, searchQuery]);

  useEffect(() => {
    setPage(1); // Reinicia la paginación
    setArticles([]); // Limpia los datos anteriores
  }, [searchQuery]);

  // Configurar Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [isFetching]);

  if (isLoading && articles.length === 0) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const openUpdateModal = (id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentArticleId(encodedId);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentArticleId(null);
    refetch();
  };

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

  const tableData = articles?.map((article) => {
    const brand = brandData?.find((data) => data.id === article.brand_id);
    const item = itemData?.find((data) => data.id === article.item_id);

    return {
      key: article.id,
      brand: brand?.name || "NO BRAND",
      image: (
        <div className="flex justify-center items-center">
          <img
            src={(article.images && article.images[0]) || "NOT FOUND"}
            className="h-10"
          />
        </div>
      ),
      pdf: article.pdfs,
      item: item?.name || "NO ITEM",
      id: article.id,
      supplier: article.supplier_code,
      name: article.name,
      edit: (
        <div className="flex justify-center items-center">
          <FaPencil
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openUpdateModal(article.id)}
          />
        </div>
      ),
      erase: (
        <div className="flex justify-center items-center">
          <FaTrashCan
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openDeleteModal(article.id)}
          />
        </div>
      ),
    };
  });

  const tableHeader = [
    { name: "Brand", key: "brand" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    {
      component: <FaRegFilePdf className="text-center text-xl" />,
      key: "pdf",
    },
    { name: "Item", key: "item" },
    { name: "Id", key: "id" },
    { name: "Supplier Code", key: "supplier code" },
    { name: "Name", key: "name" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
    ],
    filters: [
      {
        content: (
          <Input
            placeholder={"Search..."}
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                setArticles([]); // Limpiar los artículos para nueva búsqueda
                setPage(1); // Reiniciar paginación
              }
            }}
          />
        ),
      },
    ],
    results: `${countArticlesData || 0} Results`,
  };

  console.log(countArticlesData);
  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">ARTICLES</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
          {currentArticleId && (
            <UpdateArticleComponent
              articleId={currentArticleId}
              closeModal={closeUpdateModal}
            />
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteArticleComponent
            articleId={currentArticleId || ""}
            closeModal={closeDeleteModal}
          />
        </Modal>

        {/* Elemento observado para scroll infinito */}
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
