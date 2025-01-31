"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaPlus } from "react-icons/fa";
import {
  NotificationType,
  useCountNotificationsQuery,
  useGetNotificationsPagQuery,
} from "@/redux/services/notificationsApi";
import { format } from "date-fns";
import { FaTrashCan } from "react-icons/fa6";
import Modal from "@/app/components/components/Modal";
import CreateNotificationComponent from "./CreateNotification";
import DeleteNotificationComponent from "./DeleteNotification";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationType, setNotificationType] = useState<
    NotificationType | undefined
  >(undefined);
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  const { data: countNotificationsData } = useCountNotificationsQuery(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentNotificationId, setCurrentNotificationId] = useState<
    string | null
  >(null);
  const [items, setItems] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data: brandsData } = useGetBrandsQuery(null);
  const {
    data: notifications,
    error,
    isLoading,
    refetch,
  } = useGetNotificationsPagQuery({
    page,
    limit,
    query: searchQuery,
    type: notificationType,
    sort: sortQuery,
  }); // Agregar type aquí

  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const newBrands = result.data || []; // Garantiza que siempre sea un array
          setItems((prev) => [...prev, ...newBrands]);
        })
        .catch((error) => {
          console.error("Error fetching articles:", error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [page, sortQuery, searchQuery, notificationType]);

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

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const openDeleteModal = (id: string) => {
    setCurrentNotificationId(id);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentNotificationId(null);
    refetch();
  };

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
      setItems([]);
      // setHasMore(true);
    },
    [sortQuery]
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as NotificationType | "all";
    setNotificationType(value === "all" ? undefined : value);
    setPage(1);
    refetch();
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData =
    items?.map((notification) => {
      const brand = brandsData?.find(
        (data: any) => data.id === notification.brand_id
      );
      return {
        key: notification._id,
        brand: brand?.name || "N/A",
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
    }) || [];

  const tableHeader = [
    { name: "Brand", key: "brand" },
    { name: "Type", key: "type" },
    { name: "Title", key: "title" },
    { name: "Description", key: "description" },
    { name: "Validity", key: "validity" },
    { name: "Date", key: "date" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "New",
        onClick: openCreateModal,
      },
    ],
    filters: [
      {
        content: (
          <select onChange={handleFilterChange} value={notificationType}>
            <option value="all">TYPE</option>
            {Object.entries(NotificationType).map(([key, value]) => (
              <option key={key} value={key}>
                {value.toUpperCase()}
              </option>
            ))}
          </select>
        ),
      },
      {
        content: (
          <Input
            placeholder={"Search..."}
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: searchQuery
      ? `${notifications?.length || 0} Results`
      : `${countNotificationsData || 0} Results`,
  };

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

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateNotificationComponent closeModal={closeCreateModal} />
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteNotificationComponent
            notificationId={currentNotificationId || ""}
            closeModal={closeDeleteModal}
          />
        </Modal>
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
