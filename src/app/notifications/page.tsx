"use client";
import React, { useEffect, useMemo, useState } from "react";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import { useClient } from "../context/ClientContext";
import { useAuth } from "../context/AuthContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import {
  useGetUserByIdQuery,
  useMarkNotificationAsReadMutation,
} from "@/redux/services/usersApi";
import { useMarkNotificationAsReadCustomerMutation } from "@/redux/services/customersApi";
import { InfoIcon } from "lucide-react";
import Modal from "../components/components/Modal";
import NotificationsDetail from "./NotificationDetail";


const Page = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const { userData } = useAuth();

  const userQuery = useGetUserByIdQuery({ id: userData?._id || "" });

  const customerQuery = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  // Efecto para hacer refetch al montar el componente
  useEffect(() => {
    if (selectedClientId) {
      customerQuery.refetch();
    } else {
      userQuery.refetch();
    }
  }, []);

  const notifications = selectedClientId
    ? customerQuery.data?.notifications || []
    : userQuery.data?.notifications || [];

  const currentUserId = selectedClientId || userQuery.data?._id || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>("");
  const [localNotifications, setLocalNotifications] = useState<any[]>([]);
  
  // Estados para el modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      setLocalNotifications(notifications.filter((n: any) => n.send === true));
    }
  }, [JSON.stringify(notifications)]); // ✅ Usa stringify para prevenir cambios de referencia

  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
  }, 100);

  const filteredNotifications = localNotifications.filter(
    (notification: any) => {
      if (!searchQuery) return true;
      const lowerSearch = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(lowerSearch) ||
        notification.description.toLowerCase().includes(lowerSearch)
      );
    }
  );

  const sortedNotifications = useMemo(() => {
    if (!sortQuery) return filteredNotifications;

    const [field, direction] = sortQuery.split(":");
    return [...filteredNotifications].sort((a, b) => {
      if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
      if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredNotifications, sortQuery]);

  const { data: branchData } = useGetBranchesQuery(null);
  const { data: articleData } = useGetAllArticlesQuery(null);

  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [markNotificationCustomerAsRead] =
    useMarkNotificationAsReadCustomerMutation();

  const handleMarkAsRead = async (notification: any) => {
    if (!notification.read && currentUserId) {
      try {
        if (selectedClientId) {
          await markNotificationCustomerAsRead({
            id: currentUserId,
            notificationId: notification._id,
          }).unwrap();
        } else {
          await markNotificationAsRead({
            id: currentUserId,
            title: notification.title,
          }).unwrap();
        }

        setLocalNotifications((prev) =>
          prev.map((n) =>
            n.title === notification.title ? { ...n, read: true } : n
          )
        );
      } catch (err) {
        console.error("Error al marcar notificación como leída", err);
      }
    }
  };

  // Funciones para abrir y cerrar el modal de detalle
  const openDetailModal = (notification: any) => {
    setCurrentNotification(notification);
    setIsDetailOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setCurrentNotification(null);
  };

  const tableData = sortedNotifications.map((notification) => ({
    key: notification._id,
    info: (
      <button onClick={() => openDetailModal(notification)}>
        <InfoIcon className="text-center" />
      </button>
    ),
    type: notification.type,
    title: notification.title,
    description: notification.description,
    brand:
      branchData?.find((b) => b.id === notification.brand_id)?.name ||
      t("table.noBrand"),
    article:
      articleData?.find((a) => a.id === notification.article_id)?.name ||
      t("table.noBrand"),
    read: (
      <button
        onClick={() => handleMarkAsRead(notification)}
        disabled={notification.read}
      >
        {notification.read ? <MdVisibility /> : <MdVisibilityOff />}
      </button>
    ),
  }));

  const tableHeader = [
    { name: t("info"), key: "info" },
    { name: t("table.type"), key: "type", important: true },
    { name: t("table.title"), key: "title", important: true },
    { name: t("table.description"), key: "description" },
    { name: t("table.brand"), key: "brand" },
    { name: t("table.article"), key: "article" },
    { name: t("table.read"), key: "read", important: true },
  ];

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("page.notifications")}</h3>
        <Header
          headerBody={{
            buttons: [],
            filters: [],
            results: `${sortedNotifications.length} ${t("header.results")}`,
          }}
        />
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={(field) =>
            setSortQuery((prev) =>
              prev.startsWith(field) && prev.endsWith("asc")
                ? `${field}:desc`
                : `${field}:asc`
            )
          }
          sortField={sortQuery.split(":")[0]}
          sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
        />
      </div>

      <Modal isOpen={isDetailOpen} onClose={closeDetailModal}>
        <NotificationsDetail
          notification={currentNotification}
          closeModal={closeDetailModal}
        />
      </Modal>
    </PrivateRoute>
  );
};

export default Page;
