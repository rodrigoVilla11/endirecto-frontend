"use client";
import React, { useEffect, useState, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { FaTimes as FaTimes } from "react-icons/fa";
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";
import { useClient } from "../context/ClientContext";
import { useAuth } from "../context/AuthContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useMarkNotificationAsReadMutation } from "@/redux/services/usersApi";
import {useMarkNotificationAsReadCustomerMutation} from "@/redux/services/customersApi"

const Page = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const { userData } = useAuth();

  // Si hay un cliente seleccionado, obtenemos sus notificaciones
  const customerQuery = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    {
      skip: !selectedClientId,
    }
  );

  // Determinamos la fuente de las notificaciones:
  // Si hay id en selectedClient, usamos las del query; sino, las de userData.
  const notifications = selectedClientId
    ? customerQuery.data?.notifications || []
    : userData?.notifications || [];

  // Variable para saber de qué user obtener el id (cliente o usuario logueado)
  const currentUserId = selectedClientId || userData?._id || "";

  // Estados para búsqueda y ordenamiento
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato "campo:asc" o "campo:desc"

  // Debounce para búsqueda
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
  }, 100);

  // Filtramos las notificaciones en función de la búsqueda
  const filteredNotifications = notifications.filter((notification: any) => {
    if (!searchQuery) return true;
    const lowerSearch = searchQuery.toLowerCase();
    return (
      notification.title.toLowerCase().includes(lowerSearch) ||
      notification.description.toLowerCase().includes(lowerSearch)
    );
  });

  // Ordenamos las notificaciones si se especifica un sortQuery
  const sortedNotifications = [...filteredNotifications];
  if (sortQuery) {
    const [field, direction] = sortQuery.split(":");
    sortedNotifications.sort((a, b) => {
      if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
      if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Obtenemos datos de marcas y artículos
  const { data: branchData } = useGetBranchesQuery(null);
  const { data: articleData } = useGetAllArticlesQuery(null);

  // Hook para el endpoint de marcar notificación como leída
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();

  // Función para manejar la acción de marcar la notificación como leída
  const handleMarkAsRead = async (notification: any) => {
    if (!notification.read && currentUserId) {
      try {
        await markNotificationAsRead({
          id: currentUserId,
          title: notification.title,
        }).unwrap();
        // Actualizamos el estado local: marcamos la notificación como leída
        const updated = sortedNotifications.map((n) =>
          n.title === notification.title ? { ...n, read: true } : n
        );
        // Actualizamos el array original (esto afectará el filtrado/ordenamiento)
        // Nota: Si la fuente proviene de RTK Query, considera refetch o actualizar cache.
        // Aquí actualizamos el estado local derivado.
        notifications.forEach((n: any, index: any) => {
          if (n.title === notification.title) {
            notifications[index].read = true;
          }
        });
      } catch (err) {
        console.error("Error al marcar notificación como leída", err);
      }
    }
  };

  // Mapeamos los datos para la tabla y añadimos el botón de "read"
  const tableData = sortedNotifications.map((notification) => {
    const branch = branchData?.find((b) => b.id === notification.brand_id);
    const article = articleData?.find((a) => a.id === notification.article_id);
    return {
      key: notification._id,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      brand: branch?.name || t("table.noBrand"),
      article: article?.name || t("table.noBrand"),
      // Nueva columna para el botón que muestra el estado read
      read: (
        <button
          onClick={() => handleMarkAsRead(notification)}
          disabled={notification.read}
        >
          {notification.read ? <MdVisibility /> : <MdVisibilityOff />}
        </button>
      ),
    };
  });

  const tableHeader = [
    { name: t("table.type"), key: "type" },
    { name: t("table.title"), key: "title" },
    { name: t("table.description"), key: "description" },
    { name: t("table.brand"), key: "brand" },
    { name: t("table.article"), key: "article" },
    { name: t("table.read"), key: "read" },
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
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  // La búsqueda se realiza de forma local
                }
              }}
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
                aria-label={t("page.clearSearch")}
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: `${sortedNotifications.length} ${t("header.results")}`,
  };

  // En caso de que se esté cargando el query para el cliente, mostramos un spinner
  if (selectedClientId && customerQuery.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (selectedClientId && customerQuery.error) {
    return (
      <div className="p-4 text-red-500">
        {t("page.errorLoadingNotifications")}
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "MARKETING"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("page.notifications")}</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={(field: string) => {
            const [currentField, currentDirection] = sortQuery.split(":");
            let newSortQuery = "";
            if (currentField === field) {
              newSortQuery =
                currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
            } else {
              newSortQuery = `${field}:asc`;
            }
            setSortQuery(newSortQuery);
          }}
          sortField={sortQuery.split(":")[0]}
          sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
        />
      </div>
    </PrivateRoute>
  );
};

export default Page;
