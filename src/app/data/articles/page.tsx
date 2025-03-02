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
import MobileTable from "@/app/components/components/MobileTable";
import Modal from "@/app/components/components/Modal";
import UpdateArticleComponent from "./UpdateArticle";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";
import { FaImage, FaPencil, FaInfo } from "react-icons/fa6";
import { AiOutlineDownload } from "react-icons/ai";
import { FaInfoCircle, FaTimes } from "react-icons/fa";
import { GoPencil } from "react-icons/go";

import { useGetArticlesQuery } from "@/redux/services/articlesApi";
// 👇 Agrega estos imports para las marcas e ítems
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetItemsQuery } from "@/redux/services/itemsApi";

import { useTranslation } from "react-i18next";
import ArticleDetail from "./ArticleDetail";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados de paginación, artículos, búsqueda y sort
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [modalState, setModalState] = useState<{
    type: "update" | "delete" | "info" | null;
    articleId: string | null;
  }>({ type: null, articleId: null });
  const [isLoading, setIsLoading] = useState(false);
  const [sortQuery, setSortQuery] = useState<string>(""); // "campo:asc" o "campo:desc"

  // 👇 Estados para filtrar por marca e ítem
  const [brandFilter, setBrandFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("");

  // Referencias para el infinite scroll
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Llamadas a APIs
  const { data: brands } = useGetBrandsQuery(null);
  const { data: items } = useGetItemsQuery(null);

  // Se incluye brand e item en la query
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
      brand: brandFilter, // 👈 se pasa el filtro de marca
      item: itemFilter,   // 👈 se pasa el filtro de ítem
    },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // Función para alternar el orden
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";

      if (currentField === field) {
        // Alternar asc/desc
        newSortQuery =
          currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        // Nuevo campo => asc por defecto
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

  // Cuando cambie brandFilter o itemFilter, se resetea la paginación y artículos
  const handleBrandChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setBrandFilter(e.target.value);
    setPage(1);
    setArticles([]);
  }, []);

  const handleItemChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemFilter(e.target.value);
    setPage(1);
    setArticles([]);
  }, []);

  // Efecto para cargar artículos
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

        // Si vienen menos artículos que el límite, no hay más
        setHasMore(newItems.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error(t("errorLoadingArticles"), error);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [
    page,
    searchQuery,
    sortQuery,
    brandFilter,
    itemFilter, // 👈 se incluye en las dependencias
    refetch,
    isLoading,
    t,
  ]);

  // Intersection Observer para infinite scroll
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, isLoading]);

  // Manejadores para abrir/cerrar modales
  const handleModalOpen = useCallback(
    (type: "update" | "delete" | "info", id: string) => {
      setModalState({ type, articleId: id });
    },
    []
  );

  const handleModalClose = useCallback(
    async (type: "update" | "delete" | "info") => {
      setModalState({ type: null, articleId: null });
      // Esperar un poco para asegurar actualización
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

  // Datos que se mostrarán en la tabla
  const tableData = useMemo(
    () =>
      articles.map((article) => ({
        key: article.id,
        info: (
          <div className="flex justify-center items-center">
            <FaInfoCircle
              className="text-center text-xl hover:cursor-pointer hover:text-blue-500 text-green-500"
              onClick={() => handleModalOpen("info", article.id)}
            />
          </div>
        ),
        brand: article.brand?.name || t("noBrand"),
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
        item: article.item?.name || t("noItem"),
        id: article.id,
        supplier: article.supplier_code,
        name: article.name,
        edit: (
          <div className="flex justify-center items-center">
            <GoPencil
              className="text-center font-bold text-3xl text-white hover:cursor-pointer hover:text-black bg-green-400 p-1.5 rounded-sm"
              onClick={() => handleModalOpen("update", article.id)}
            />
          </div>
        ),
      })),
    [articles, handleModalOpen, t]
  );

  // Estructura de encabezados de tabla
  const tableHeader = useMemo(
    () => [
      {
        component: <FaInfoCircle className="text-center text-xl" />,
        key: "info",
        sortable: false,
        important: true,
      },
      { name: t("brand"), key: "brand", sortable: true, important: true },
      {
        component: <FaImage className="text-center text-xl" />,
        key: "image",
        sortable: false,
        important: true,
      },
      { name: t("item"), key: "item", sortable: true },
      { name: t("id"), key: "id", sortable: true, important: true },
      { name: t("supplierCode"), key: "supplier", sortable: true },
      { name: t("name"), key: "name", sortable: true },
      {
        component: <GoPencil className="text-center text-lg" />,
        key: "edit",
        sortable: false,
      },
    ],
    [t]
  );

  // Armado del Header (botones, filtros, etc.)
  const headerBody = useMemo(() => {
    return {
      buttons: [
        {
          logo: <AiOutlineDownload />,
          title: t("download"),
        },
      ],
      filters: [
        // Filtro de búsqueda
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
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={handleResetSearch}
                  aria-label={t("clearSearch")}
                >
                  <FaTimes className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          ),
        },
        // Filtro por marca
        {
          content: (
            <select
              className="w-full max-w-sm border border-gray-300 rounded-md p-2 md:p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={brandFilter}
              onChange={handleBrandChange}
            >
              <option value="">{t("allBrands")}</option>
              {brands?.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ),
        },
        // Filtro por ítem
        {
          content: (
            <select
              className="w-full max-w-sm border border-gray-300 rounded-md p-2 md:p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={itemFilter}
              onChange={handleItemChange}
            >
              <option value="">{t("allItems")}</option>
              {items?.map((it: any) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
          ),
        },
      ],
      results: t("results", { count: data?.totalItems || 0 }),
    };
  }, [
    searchQuery,
    brandFilter,
    itemFilter,
    data,
    brands,
    items,
    debouncedSearch,
    handleResetSearch,
    handleBrandChange,
    handleItemChange,
    t,
  ]);

  if (isQueryLoading && articles.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{t("errorLoadingArticles")}</div>;
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold pt-4 px-4">{t("articles")}</h3>
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

        {/* Modal para actualizar artículo */}
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

        {/* Modal para ver detalle del artículo */}
        <Modal
          isOpen={modalState.type === "info"}
          onClose={() => handleModalClose("info")}
        >
          {modalState.articleId && (
            <ArticleDetail
              data={articles.find(
                (article) => article.id === modalState.articleId
              )}
              onClose={() => handleModalClose("info")}
            />
          )}
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
