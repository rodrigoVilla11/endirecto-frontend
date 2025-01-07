"use client";
import React, { useState, useEffect, useRef } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil, FaTrashCan } from "react-icons/fa6";
import { AiOutlineDownload } from "react-icons/ai";
import { FaRegFilePdf, FaTimes } from "react-icons/fa";
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
import debounce from "@/app/context/debounce";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Estados básicos
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados para modales
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);

  // Referencias
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux (mantenidas como estaban)
  const { data: brandData } = useGetBrandsQuery(null);
  const { data: itemData } = useGetItemsQuery(null);
  const { data: countArticlesData } = useCountArticlesQuery({
    query: searchQuery,
  });
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetArticlesQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
  });

  // Búsqueda con debounce
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setArticles([]);
    setHasMore(true);
  }, 100);

  // Efecto para manejar la carga inicial y las búsquedas
  useEffect(() => {
    const loadArticles = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newArticles = result || [];

          if (page === 1) {
            setArticles(newArticles);
          } else {
            setArticles((prev) => [...prev, ...newArticles]);
          }

          setHasMore(newArticles.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading articles:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadArticles();
  }, [page, searchQuery]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    const currentObserver = observerRef.current;
    if (currentObserver) {
      observer.observe(currentObserver);
    }

    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver);
      }
    };
  }, [hasMore, isLoading]);

  // Manejadores de modales
  const handleModalOpen = (type: "update" | "delete", id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentArticleId(encodedId);
    if (type === "update") {
      setUpdateModalOpen(true);
    } else {
      setDeleteModalOpen(true);
    }
  };

  const handleModalClose = (type: "update" | "delete") => {
    if (type === "update") {
      setUpdateModalOpen(false);
    } else {
      setDeleteModalOpen(false);
    }
    setCurrentArticleId(null);
    refetch();
  };

  // Reset de búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setArticles([]);
    setHasMore(true);
  };

  // Configuración de la tabla
  const tableData = articles?.map((article) => ({
    key: article.id,
    brand:
      brandData?.find((b) => b.id === article.brand_id)?.name || "NO BRAND",
    image: (
      <div className="flex justify-center items-center">
        {article.images?.[0] ? (
          <img
            src={article.images[0]}
            alt={article.name}
            className="h-10 w-auto object-contain"
          />
        ) : (
          <span className="text-gray-400">No image</span>
        )}
      </div>
    ),
    pdf: article.pdfs,
    item: itemData?.find((i) => i.id === article.item_id)?.name || "NO ITEM",
    id: article.id,
    supplier: article.supplier_code,
    name: article.name,
    edit: (
      <div className="flex justify-center items-center">
        <FaPencil
          className="text-center text-lg hover:cursor-pointer hover:text-blue-500"
          onClick={() => handleModalOpen("update", article.id)}
        />
      </div>
    ),
    erase: (
      <div className="flex justify-center items-center">
        <FaTrashCan
          className="text-center text-lg hover:cursor-pointer hover:text-red-500"
          onClick={() => handleModalOpen("delete", article.id)}
        />
      </div>
    ),
  }));

  const tableHeader = [
    { name: "Brand", key: "brand" },
    { component: <FaImage className="text-center text-xl" />, key: "image" },
    { component: <FaRegFilePdf className="text-center text-xl" />, key: "pdf" },
    { name: "Item", key: "item" },
    { name: "Id", key: "id" },
    { name: "Supplier Code", key: "supplier" },
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
          <div className="relative">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                debouncedSearch(e.target.value)
              }
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleResetSearch}
                aria-label="Clear search"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results:  `${countArticlesData || 0} Results`,
  };

  if (isQueryLoading && articles.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading articles. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">ARTICLES</h3>
        <Header headerBody={headerBody} />

        {isLoading && articles.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No articles found
          </div>
        ) : (
          <>
            <Table headers={tableHeader} data={tableData} />
            {isLoading && (
              <div ref={loadingRef} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}
        <div ref={observerRef} className="h-10" />

        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => handleModalClose("update")}
        >
          {currentArticleId && (
            <UpdateArticleComponent
              articleId={currentArticleId}
              closeModal={() => handleModalClose("update")}
            />
          )}
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => handleModalClose("delete")}
        >
          {currentArticleId && (
            <DeleteArticleComponent
              articleId={currentArticleId}
              closeModal={() => handleModalClose("delete")}
            />
          )}
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
