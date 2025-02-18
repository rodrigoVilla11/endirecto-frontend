"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaPlus, FaTimes } from "react-icons/fa";
import { useGetTechnicalDetailsQuery } from "@/redux/services/technicalDetails";
import CreateTechnicalDetailsModal from "./CreateTechincalDetail";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados básicos
  const [page, setPage] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState("");
  const [technicalDetails, setTechnicalDetails] = useState<any[]>([]);
  const [totalTechnicalDetails, setTotalTechnicalDetails] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // Referencia para el Intersection Observer
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Se espera que useGetTechnicalDetailsQuery retorne un objeto con { technicalDetails, total }
  const { data, error, isLoading, refetch } = useGetTechnicalDetailsQuery({
    page,
    limit,
    query: searchQuery,
  });

  // Efecto para cargar la data (infinite scroll y búsqueda)
  useEffect(() => {
    const loadTechnicalDetails = async () => {
      if (!isFetching) {
        setIsFetching(true);
        try {
          // Se espera que el resultado tenga la forma: 
          // { technicalDetails: TechnicalDetail[], total: number }
          const result = await refetch().unwrap();
          const fetched = result || { technicalDetails: [], total: 0 };
          const newItems = Array.isArray(fetched.technicalDetails)
            ? fetched.technicalDetails
            : [];
          setTotalTechnicalDetails(fetched.total || 0);
          if (page === 1) {
            setTechnicalDetails(newItems);
          } else {
            setTechnicalDetails((prev) => [...prev, ...newItems]);
          }
          setHasMore(newItems.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error fetching technical details:", error);
        } finally {
          setIsFetching(false);
        }
      }
    };

    loadTechnicalDetails();
  }, [page, searchQuery, refetch, isFetching]);

  // Intersection Observer para el infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isFetching) {
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
  }, [hasMore, isFetching]);

  // Handler para resetear la búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setTechnicalDetails([]);
    setHasMore(true);
  };

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setPage(1);
    setTechnicalDetails([]);
    refetch();
  };

  // Configuración de la tabla
  const tableData = technicalDetails.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  const tableHeader = [
    { name: t("table.id"), key: "id", important: true },
    { name: t("table.name"), key: "name", important: true },
  ];

  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: t("page.new"), onClick: openCreateModal },
    ],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder={t("page.searchPlaceholder")}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setTechnicalDetails([]);
                  refetch();
                }
              }}
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
    results: t("page.results", { count: totalTechnicalDetails }),
  };

  if (isLoading && technicalDetails.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("page.errorLoadingTechnicalDetails")}
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("page.technicalDetailsTitle")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={observerRef} className="h-10" />
        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateTechnicalDetailsModal closeModal={closeCreateModal} />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
