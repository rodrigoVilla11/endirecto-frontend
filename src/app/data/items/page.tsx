"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil, FaInfo } from "react-icons/fa6";
import { FaInfoCircle, FaTimes } from "react-icons/fa";
import {
  useCountItemsQuery,
  useGetItemsPagQuery,
} from "@/redux/services/itemsApi";
import Modal from "@/app/components/components/Modal";
import UpdateItemComponent from "./UpdateItem";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";
import ItemDetail from "./ItemDetail";
import { GoPencil } from "react-icons/go";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  // Estados de los modales: actualización y detalle
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  // Referencias
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Consultas Redux
  const { data: countItemsData } = useCountItemsQuery(null);
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetItemsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
  });

  // Búsqueda debounced
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, 100);

  // Efecto para carga inicial y búsquedas
  useEffect(() => {
    const loadItems = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newItems = result || [];
          if (page === 1) {
            setItems(newItems);
          } else {
            setItems((prev) => [...prev, ...newItems]);
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
  }, [page, searchQuery, sortQuery, isLoading, refetch]);

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

  // Handlers de modales
  const handleUpdateModalOpen = (id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentItemId(encodedId);
    setUpdateModalOpen(true);
  };

  const handleDetailModalOpen = (id: string) => {
    setCurrentItemId(id);
    setDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setUpdateModalOpen(false);
    setDetailModalOpen(false);
    setCurrentItemId(null);
    refetch();
  };

  // Reiniciar búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";
      if (currentField === field) {
        newSortQuery =
          currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        newSortQuery = `${field}:asc`;
      }
      setSortQuery(newSortQuery);
      setPage(1);
      setItems([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  // Configuración de la tabla
  const tableData = items?.map((item) => ({
    key: item.id,
    // Nueva columna de info
    info: (
      <div className="flex justify-center items-center">
        <FaInfoCircle
          className="text-center text-xl hover:cursor-pointer hover:text-blue-500 text-green-500"
          onClick={() => handleDetailModalOpen(item.id)}
        />
      </div>
    ),
    id: item.id,
    name: item.name,
    image: (
      <div className="flex justify-center items-center">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-10 w-auto object-contain"
          />
        ) : (
          <span className="text-gray-400">{t("page.noImage")}</span>
        )}
      </div>
    ),
    edit: (
      <div className="flex justify-center items-center">
        <GoPencil
          className="text-center font-bold text-3xl text-white hover:cursor-pointer hover:text-black bg-green-400 p-1.5 rounded-sm"
          onClick={() => handleUpdateModalOpen(item.id)}
        />
      </div>
    ),
  }));

  const tableHeader = [
    {
      component: <FaInfoCircle className="text-center text-xl" />,
      key: "info",
      important: true,
    },
    { name: t("table.id"), key: "id", important: true, sortable: true },
    { name: t("table.name"), key: "name", important: true, sortable: true },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
      important: true,
    },
    { component: <GoPencil className="text-center text-xl" />, key: "edit" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder={t("page.searchPlaceholder")}
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
                aria-label={t("page.clearSearch")}
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: searchQuery
      ? t("page.results", { count: items.length })
      : t("page.results", { count: countItemsData || 0 }),
  };

  if (isQueryLoading && items.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">{t("page.errorLoadingItems")}</div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold pt-4 px-4">{t("page.itemsTitle")}</h3>
        <Header headerBody={headerBody} />

        {isLoading && items.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("page.noItemsFound")}
          </div>
        ) : (
          <>
            <Table
              headers={tableHeader}
              data={tableData}
              onSort={handleSort}
              sortField={sortQuery.split(":")[0]}
              sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
            />
            {isLoading && (
              <div ref={loadingRef} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}
        <div ref={observerRef} className="h-10" />

        {/* Modal para actualizar ítem */}
        <Modal isOpen={isUpdateModalOpen} onClose={handleModalClose}>
          {currentItemId && (
            <UpdateItemComponent
              itemId={currentItemId}
              closeModal={handleModalClose}
            />
          )}
        </Modal>

        {/* Modal para ver detalle del ítem */}
        <Modal isOpen={isDetailModalOpen} onClose={handleModalClose}>
          {currentItemId && (
            <ItemDetail
              data={items.find((item) => item.id === currentItemId)}
              onClose={handleModalClose}
            />
          )}
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
