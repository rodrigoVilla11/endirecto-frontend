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

  useEffect(() => {
    if (selectedClientId) {
      customerQuery.refetch();
    } else {
      userQuery.refetch();
    }
  }, []);

  // Obtenemos las notificaciones según el usuario o cliente seleccionado
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

  // Filtramos las notificaciones que tienen send === true
  useEffect(() => {
    if (notifications.length > 0) {
      setLocalNotifications(
        notifications.filter((n: any) => n.send === true)
      );
    }
  }, [JSON.stringify(notifications)]);

  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
  }, 100);

  // Filtrado por búsqueda en título o descripción
  const filteredNotifications = localNotifications.filter((notification: any) => {
    if (!searchQuery) return true;
    const lowerSearch = searchQuery.toLowerCase();
    return (
      notification.title.toLowerCase().includes(lowerSearch) ||
      notification.description.toLowerCase().includes(lowerSearch)
    );
  });

  // Ordenamos las notificaciones:
  // Si no hay sortQuery, las ordenamos por schedule_from descendente
  const sortedNotifications = useMemo(() => {
    if (!sortQuery) {
      return [...filteredNotifications].sort((a, b) => {
        return new Date(b.schedule_from).getTime() - new Date(a.schedule_from).getTime();
      });
    }
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
  const [markNotificationCustomerAsRead] = useMarkNotificationAsReadCustomerMutation();

  // Función para marcar la notificación como leída y actualizar el estado
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
        // Actualizamos el estado local de forma optimista
        setLocalNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
      } catch (err) {
        console.error("Error al marcar notificación como leída", err);
      }
    }
  };

  // Maneja el clic en el botón de notificación, evitando llamadas duplicadas
  const handleNotificationClick = async (
    notification: any,
    event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    await handleMarkAsRead(notification);
    // Refetch para obtener el estado actualizado del backend
    if (selectedClientId) {
      await customerQuery.refetch();
    } else {
      await userQuery.refetch();
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

  // Construimos los datos de la tabla sin incluir el campo schedule_from
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
    read: (
      <button
        onClick={(e) => handleNotificationClick(notification, e)}
        disabled={notification.read}
      >
        {notification.read ? <MdVisibility /> : <MdVisibilityOff />}
      </button>
    ),
  }));

  // Configuración de los encabezados de la tabla sin la columna schedule_from
  const tableHeader = [
    { name: t("info"), key: "info" },
    { name: t("table.type"), key: "type", important: true },
    { name: t("table.title"), key: "title", important: true },
    { name: t("table.description"), key: "description" },
    { name: t("table.read"), key: "read" },
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
