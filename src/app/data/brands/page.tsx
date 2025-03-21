"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import Modal from "@/app/components/components/Modal";
import UpdateBrandComponent from "./UpdateBrand";
import BrandDetail from "./BrandDetail";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";
import { FaImage, FaInfoCircle, FaTimes } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import {
  useCountBrandsQuery,
  useGetBrandsPagQuery,
} from "@/redux/services/brandsApi";

const ITEMS_PER_PAGE = 20;

const Page = () => {
  const { t } = useTranslation();

  // Estados principales
  const [page, setPage] = useState(1);
  const [brands, setBrands] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Ejemplo: "campo:asc" o "campo:desc"

  // Estados de modales y marca seleccionada
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null);

  // Referencia para el IntersectionObserver (scroll infinito)
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Consultas con Redux
  const { data: countBrandsData } = useCountBrandsQuery(null);
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetBrandsPagQuery(
    { page, limit: ITEMS_PER_PAGE, query: searchQuery, sort: sortQuery },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // Función debounced para actualizar el searchQuery
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setPage(1);
      setBrands([]); // Reinicia la lista de marcas al buscar
      setHasMore(true);
    }, 300), // Puedes ajustar el tiempo de espera aquí (300ms recomendado)
    []
  );

  // Efecto para actualizar la lista de marcas cuando llegan nuevos datos
  useEffect(() => {
    if (data) {
      setBrands((prevBrands) => {
        // Si estamos en la primera página, reemplazamos la lista
        if (page === 1) {
          return data;
        }
        // Filtramos marcas nuevas que no existan en la lista actual
        const newBrands = data.filter(
          (brand) => !prevBrands.some((prev) => prev.id === brand.id)
        );
        return [...prevBrands, ...newBrands];
      });
      setHasMore(data.length === ITEMS_PER_PAGE);
    }
  }, [data, page]);

  // Configuración del IntersectionObserver para scroll infinito
  const lastBrandRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isQueryLoading) {
            setPage((prevPage) => prevPage + 1);
          }
        },
        { threshold: 0.0, rootMargin: "200px" }
      );

      if (node) observerRef.current.observe(node);
    },
    [hasMore, isQueryLoading]
  );

  // Handlers para abrir modales
  const openUpdateModal = (id: string) => {
    setCurrentBrandId(encodeURIComponent(id));
    setUpdateModalOpen(true);
  };

  const openDetailModal = (id: string) => {
    setCurrentBrandId(id);
    setDetailModalOpen(true);
  };

  // Cierra modales y refetch de datos
  const closeModal = () => {
    setUpdateModalOpen(false);
    setDetailModalOpen(false);
    setCurrentBrandId(null);
    refetch();
  };

  // Handler para ordenar la tabla
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSort = "";
      if (currentField === field) {
        newSort = currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        newSort = `${field}:asc`;
      }
      setSortQuery(newSort);
      setPage(1);
      setBrands([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  // Reinicia el search
  const resetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setBrands([]);
    setHasMore(true);
  };

  // Datos formateados para la tabla
  const tableData = brands.map((brand) => ({
    key: brand.id,
    info: (
      <div className="flex justify-center items-center">
        <FaInfoCircle
          className="text-center text-xl hover:cursor-pointer hover:text-blue-500 text-green-500"
          onClick={() => openDetailModal(brand.id)}
        />
      </div>
    ),
    id: brand.id,
    name: brand.name,
    image: (
      <div className="flex justify-center items-center">
        {brand.images ? (
          <img
            src={brand.images}
            alt={brand.name}
            className="h-10 w-auto object-contain"
          />
        ) : (
          <span className="text-gray-400">{t("page.noImage")}</span>
        )}
      </div>
    ),
    sequence: brand.sequence,
    edit: (
      <div className="flex justify-center items-center">
        <GoPencil
          className="text-center font-bold text-3xl text-white hover:cursor-pointer hover:text-black bg-green-400 p-1.5 rounded-sm"
          onClick={() => openUpdateModal(brand.id)}
        />
      </div>
    ),
  }));

  // Encabezado de la tabla
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
    { name: t("table.sequence"), key: "sequence" },
    {
      component: <GoPencil className="text-center text-xl" />,
      key: "edit",
    },
  ];

  // Encabezado y filtros de la página
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder={t("page.searchPlaceholder")}
              defaultValue={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                debouncedSearch(e.target.value)
              }
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={resetSearch}
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
      ? t("page.results", { count: brands.length })
      : t("page.results", { count: countBrandsData || 0 }),
  };

  // Muestra spinner si se está cargando la consulta y aún no hay datos
  if (isQueryLoading && brands.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Muestra error en caso de que la consulta falle
  if (error) {
    return (
      <div className="p-4 text-red-500">{t("page.errorLoadingBrands")}</div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold pt-4 px-4">{t("page.brandsTitle")}</h3>
        <Header headerBody={headerBody} />

        {isLoading && brands.length === 0 ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("page.noBrandsFound")}
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
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}
        <div ref={lastBrandRef} className="h-10" />

        {/* Modal para actualizar marca */}
        <Modal isOpen={isUpdateModalOpen} onClose={closeModal}>
          {currentBrandId && (
            <UpdateBrandComponent
              brandId={currentBrandId}
              closeModal={closeModal}
            />
          )}
        </Modal>

        {/* Modal para ver detalle de la marca */}
        <Modal isOpen={isDetailModalOpen} onClose={closeModal}>
          {currentBrandId && (
            <BrandDetail
              data={brands.find((brand) => brand.id === currentBrandId)}
              onClose={closeModal}
            />
          )}
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
