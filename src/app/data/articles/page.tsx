"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil } from "react-icons/fa6";
import { AiOutlineDownload } from "react-icons/ai";
import {
  useGetArticlesQuery,
} from "@/redux/services/articlesApi";
import Modal from "@/app/components/components/Modal";
import UpdateArticleComponent from "./UpdateArticle";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";
import { FaTimes } from "react-icons/fa";
import MobileTable from "@/app/components/components/MobileTable";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos con tipos apropiados
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [modalState, setModalState] = useState<{
    type: "update" | "delete" | null;
    articleId: string | null;
  }>({ type: null, articleId: null });
  const [isLoading, setIsLoading] = useState(false);
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  // Referencias
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetArticlesQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      sort: sortQuery,
      priceListId: "3",
    },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";

      if (currentField === field) {
        // Alternar entre ascendente y descendente
        newSortQuery =
          currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        // Nuevo campo de ordenamiento, por defecto ascendente
        newSortQuery = `${field}:asc`;
      }

      setSortQuery(newSortQuery);
      setPage(1);
      setArticles([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  // Búsqueda optimizada con debounce
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setPage(1);
      setArticles([]);
    }, 100),
    []
  );

  // Effect for handling initial load and searches
  useEffect(() => {
    const loadItems = async () => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        const result = await refetch().unwrap();
        const newItems = result?.articles || [];

        if (page === 1) {
          setArticles(newItems);
        } else {
          setArticles((prev) => [...prev, ...newItems]);
        }

        // Si el total de artículos devueltos es menor que ITEMS_PER_PAGE, ya no hay más
        setHasMore(newItems.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error(t("errorLoadingArticles"), error);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [page, searchQuery, sortQuery, refetch, isLoading, t]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 } // Se activa cuando el elemento está completamente visible
    );

    observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, isLoading]);

  // Manejadores optimizados
  const handleModalOpen = useCallback(
    (type: "update" | "delete", id: string) => {
      setModalState({ type, articleId: id });
    },
    []
  );

  const handleModalClose = useCallback(
    async (type: "update" | "delete") => {
      setModalState({ type: null, articleId: null });

      // Esperar un momento para asegurar que la actualización se completó
      setTimeout(async () => {
        try {
          await refetch();
        } catch (error) {
          console.error(t("errorRefetchingData"), error);
        }
      }, 100);
    },
    [refetch, t]
  );

  const handleResetSearch = useCallback(() => {
    setSearchQuery("");
    setPage(1);
    setArticles([]);
  }, []);

  // Componentes de tabla memorizados
  const tableData = useMemo(
    () =>
      articles.map((article) => ({
        key: article.id,
        brand: article.brand.name || t("noBrand"),
        image: (
          <div className="flex justify-center items-center">
            {article.images?.[0] ? (
              <img
                src={article.images[0]}
                alt={article.name}
                className="h-10 w-auto object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-gray-400">{t("noImage")}</span>
            )}
          </div>
        ),
        item: article.item.name || t("noItem"),
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
      })),
    [articles, handleModalOpen, t]
  );

  const tableHeader = useMemo(
    () => [
      { name: t("brand"), key: "brand", sortable: true, important: true },
      {
        component: <FaImage className="text-center text-xl" />,
        key: "image",
        sortable: false,
        important: true,
      },
      { name: t("item"), key: "item", sortable: false },
      { name: t("id"), key: "id", sortable: true, important: true },
      { name: t("supplierCode"), key: "supplier", sortable: true },
      { name: t("name"), key: "name", sortable: true },
      {
        component: <FaPencil className="text-center text-xl" />,
        key: "edit",
        sortable: false,
      },
    ],
    [t]
  );

  const headerBody = useMemo(
    () => ({
      buttons: [
        {
          logo: <AiOutlineDownload />,
          title: t("download"),
        },
      ],
      filters: [
        {
          content: (
            <div className="relative">
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  debouncedSearch(e.target.value)
                }
                className="pr-8"
              />
              {searchQuery && (
                <button
                  className="right-2 top-1/2 -translate-y-1/2"
                  onClick={handleResetSearch}
                  aria-label={t("clearSearch")}
                >
                  <FaTimes className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          ),
        },
      ],
      results: t("results", { count: data?.totalItems || 0 }),
    }),
    [searchQuery, data, debouncedSearch, handleResetSearch, t]
  );

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
        {t("errorLoadingArticles")}
      </div>
    );
  }
  const isMobile = window.innerWidth < 640;

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">{t("articles")}</h3>
        <Header headerBody={headerBody} />
        {articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("noArticlesFound")}
          </div>
        ) : (
          <>
            {isMobile ? (
              <MobileTable data={tableData} handleModalOpen={handleModalOpen} />
            ) : (
              <Table
                headers={tableHeader}
                data={tableData}
                onSort={handleSort}
                sortField={sortQuery.split(":")[0]}
                sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
              />
            )}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}
        <div ref={observerRef} className="h-10" />

        <Modal
          isOpen={modalState.type === "update"}
          onClose={() => handleModalClose("update")}
        >
          {modalState.articleId && (
            <UpdateArticleComponent
              articleId={modalState.articleId}
              onUpdateSuccess={() => {
                handleModalClose("update");
              }}
              closeModal={() => handleModalClose("update")}
            />
          )}
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;