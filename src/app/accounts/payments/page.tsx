"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaPlus, FaTimes } from "react-icons/fa";
import { useGetCollectionsPagQuery } from "@/redux/services/collectionsApi";
import debounce from "@/app/context/debounce";
import CreatePaymentComponent from "./CreatePayment";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Estados para paginación, búsqueda, ordenamiento y modales
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"
  // "items" contendrá el listado de collections concatenado
  const [items, setItems] = useState<any[]>([]);
  // Total global obtenido del endpoint
  const [totalCollections, setTotalCollections] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  // Estado para abrir el modal de creación
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // Referencia para Intersection Observer (infinite scroll)
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Consulta del endpoint: se espera que retorne { collections, total }
  const { data, error, isLoading, refetch } = useGetCollectionsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
    // Puedes agregar otros filtros aquí si el endpoint lo soporta:
    // status, startDate, endDate, seller_id, customer_id, etc.
  });

  // Debounce para la búsqueda
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, 100);

  // Efecto para cargar data (paginación, búsqueda, infinite scroll)
  useEffect(() => {
    const loadCollections = async () => {
      if (!isFetching) {
        setIsFetching(true);
        try {
          // Se espera que refetch retorne un objeto con { collections, total }
          const result = await refetch().unwrap();
          const fetched = result || { collections: [], total: 0 };
          const newItems = Array.isArray(fetched.collections)
            ? fetched.collections
            : [];
          setTotalCollections(fetched.total || 0);
          if (page === 1) {
            setItems(newItems);
          } else {
            setItems((prev) => [...prev, ...newItems]);
          }
          setHasMore(newItems.length === ITEMS_PER_PAGE);
        } catch (err) {
          console.error("Error loading collections:", err);
        } finally {
          setIsFetching(false);
        }
      }
    };

    loadCollections();
  }, [page, searchQuery, sortQuery, refetch, isFetching]);

  // Intersection Observer para el infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
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

  // Reset de búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  // Handler para ordenamiento
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

  // Configuración de la tabla: mapea cada collection a un objeto para la tabla
  const tableData = items.map((collection) => ({
    key: collection._id,
    id: collection._id,
    // Ajusta los campos según la estructura de tus collections
    customer: collection.customer_id,
    date: collection.date, // Si es necesario, formatea la fecha
    amount: collection.amount,
    status: collection.status,
    seller: collection.seller_id,
  }));

  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Customer", key: "customer" },
    { name: "Date", key: "date" },
    { name: "Amount", key: "amount" },
    { name: "Status", key: "status" },
    { name: "Seller", key: "seller" },
  ];

  // Configuración del header: si hay búsqueda, muestra la cantidad local; de lo contrario, muestra el total global
  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: "New", onClick: () => setCreateModalOpen(true) },
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
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setItems([]);
                  refetch();
                }
              }}
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
      // Aquí se pueden agregar otros filtros (status, fechas, etc.) si lo deseas
    ],
    results: `${totalCollections} Results`,
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading collections. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">COLLECTIONS</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0]}
          sortOrder={(sortQuery.split(":")[1] as "asc" | "desc") || ""}
        />
        <div ref={observerRef} className="h-10" />
        <Modal isOpen={isCreateModalOpen} onClose={() => { setCreateModalOpen(false); setPage(1); setItems([]); refetch(); }}>
          <CreatePaymentComponent closeModal={() => { setCreateModalOpen(false); setPage(1); setItems([]); refetch(); }} />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
