"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaPlus, FaTrashCan } from "react-icons/fa6";
import { useGetNotificationsPagQuery } from "@/redux/services/notificationsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import debounce from "@/app/context/debounce";
import CreateNotificationComponent from "./CreateNotification";
import DeleteNotificationComponent from "./DeleteNotification";
import { FaTimes } from "react-icons/fa";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Estados para paginación, búsqueda, ordenamiento y modales
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato "campo:asc" o "campo:desc"
  // "items" contendrá el listado de notifications (concatenado)
  const [items, setItems] = useState<any[]>([]);
  // Total global devuelto por el endpoint
  const [totalNotifications, setTotalNotifications] = useState<number>(0);
  // Para manejar infinite scroll
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  // Estados para modales
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentNotificationId, setCurrentNotificationId] = useState<string | null>(null);

  // Referencia para el Intersection Observer (infinite scroll)
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Otras queries
  const { data: branchData } = useGetBranchesQuery(null);
  // Se espera que useGetNotificationsPagQuery retorne { notifications, total }
  const { data, error, isLoading, refetch } = useGetNotificationsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
  });

  // Debounced search para evitar disparos con cada tecla
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, 100);

  // Efecto para cargar los notifications (paginación, búsqueda, infinite scroll)
  useEffect(() => {
    const loadNotifications = async () => {
      if (!isFetching) {
        setIsFetching(true);
        try {
          // Se espera que el resultado tenga la forma: { notifications: Notification[], total: number }
          const result = await refetch().unwrap();
          const fetched = result || { notifications: [], total: 0 };
          const newItems = Array.isArray(fetched.notifications)
            ? fetched.notifications
            : [];
          setTotalNotifications(fetched.total || 0);
          if (page === 1) {
            setItems(newItems);
          } else {
            setItems((prev) => [...prev, ...newItems]);
          }
          setHasMore(newItems.length === ITEMS_PER_PAGE);
        } catch (err) {
          console.error("Error fetching notifications:", err);
        } finally {
          setIsFetching(false);
        }
      }
    };
    loadNotifications();
  }, [page, searchQuery, sortQuery, refetch, isFetching]);

  // Intersection Observer para infinite scroll
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

  // Handlers para modales
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setPage(1);
    setItems([]);
    refetch();
  };

  const openDeleteModal = (id: string) => {
    setCurrentNotificationId(id);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentNotificationId(null);
    setPage(1);
    setItems([]);
    refetch();
  };

  // Configuración de la tabla: se mapea cada notification
  const tableData = items.map((notification) => {
    const branch = branchData?.find((b) => b.id === notification.branch_id);
    return {
      key: notification._id,
      brand: branch?.name || "N/A",
      type: notification.type,
      title: notification.title,
      description: notification.description,
      validity: notification.schedule_to,
      date: notification.schedule_from,
      erase: (
        <div className="flex justify-center items-center">
          <FaTrashCan
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openDeleteModal(notification._id)}
          />
        </div>
      ),
    };
  });

  const tableHeader = [
    { name: "Brand", key: "brand" },
    { name: "Type", key: "type" },
    { name: "Title", key: "title" },
    { name: "Description", key: "description" },
    { name: "Validity", key: "validity" },
    { name: "Date", key: "date" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  // Configuración del header:
  // Si hay búsqueda, se muestra la cantidad local; si no, se muestra el total global
  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: "New", onClick: openCreateModal },
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
      {
        // Aquí podrías agregar un select para filtrar por NotificationType, si lo necesitas.
      },
    ],
    results: searchQuery
      ? `${items.length} Results`
      : `${totalNotifications} Results`,
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
        Error loading notifications. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "MARKETING"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">NOTIFICATIONS</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0]}
          sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
        />
        <div ref={observerRef} className="h-10" />

        {/* Modal para crear notificación */}
        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateNotificationComponent closeModal={closeCreateModal} />
        </Modal>

        {/* Modal para eliminar notificación */}
        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteNotificationComponent
            notificationId={currentNotificationId || ""}
            closeModal={closeDeleteModal}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
