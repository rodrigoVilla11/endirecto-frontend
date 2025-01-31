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
import { FaImage, FaPencil, FaTrashCan, FaRegFilePdf } from "react-icons/fa6";
import { AiOutlineDownload } from "react-icons/ai";
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
import { useInfiniteScroll } from "@/app/context/UseInfiniteScroll";
import { FaTimes } from "react-icons/fa";
import MobileTable from "@/app/components/components/MobileTable";

const ITEMS_PER_PAGE = 15;

const Page = () => {
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

  // References
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux con mejor manejo de tipos
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
  } = useGetArticlesQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      sort: sortQuery,
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

  // Memoized brand and item maps for better performance
  const brandMap = useMemo(
    () =>
      brandData?.reduce(
        (acc, brand) => ({
          ...acc,
          [brand.id]: brand.name,
        }),
        {} as Record<string, string>
      ),
    [brandData]
  );

  const itemMap = useMemo(
    () =>
      itemData?.reduce(
        (acc, item) => ({
          ...acc,
          [item.id]: item.name,
        }),
        {} as Record<string, string>
      ),
    [itemData]
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
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newItems = result || [];

          if (page === 1) {
            setArticles(newItems);
          } else {
            setArticles((prev) => [...prev, ...newItems]);
          }

          setHasMore(newItems.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading items:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadItems();
  }, [page, searchQuery]);

  // Intersection Observer for infinite scroll
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

  // Manejadores optimizados
  const handleModalOpen = useCallback(
    (type: "update" | "delete", id: string) => {
      setModalState({ type, articleId: encodeURIComponent(id) });
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
          console.error("Error refetching data:", error);
        }
      }, 100);
    },
    [refetch]
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
        brand: brandMap?.[article.brand_id] || "NO BRAND",
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
              <span className="text-gray-400">No image</span>
            )}
          </div>
        ),
        // pdf: article.pdfs,
        item: itemMap?.[article.item_id] || "NO ITEM",
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
      })),
    [articles, brandMap, itemMap, handleModalOpen]
  );

  const tableHeader = useMemo(
    () => [
      { name: "Brand", key: "brand", sortable: true },
      {
        component: <FaImage className="text-center text-xl" />,
        key: "image",
        sortable: false,
      },
      // {
      //   component: <FaRegFilePdf className="text-center text-xl" />,
      //   key: "pdf",
      //   sortable: false,
      // },
      { name: "Item", key: "item", sortable: false },
      { name: "Id", key: "id", sortable: true },
      { name: "Supplier Code", key: "supplier", sortable: true },
      { name: "Name", key: "name", sortable: true },
      {
        component: <FaPencil className="text-center text-xl" />,
        key: "edit",
        sortable: false,
      },
      {
        component: <FaTrashCan className="text-center text-xl" />,
        key: "erase",
        sortable: false,
      },
    ],
    []
  );

  const headerBody = useMemo(
    () => ({
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
                  className="right-2 top-1/2 -translate-y-1/2"
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
      results: `${countArticlesData || 0} Results`,
    }),
    [searchQuery, countArticlesData, debouncedSearch, handleResetSearch]
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
        Error loading articles. Please try again later.
      </div>
    );
  }
  const isMobile = window.innerWidth < 640;

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">ARTICLES</h3>
        <Header headerBody={headerBody} />

        {articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No articles found
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

        <Modal
          isOpen={modalState.type === "delete"}
          onClose={() => handleModalClose("delete")}
        >
          {modalState.articleId && (
            <DeleteArticleComponent
              articleId={modalState.articleId}
              closeModal={() => handleModalClose("delete")}
            />
          )}
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
