"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaDownload, FaTimes } from "react-icons/fa";
import { useGetNotificationsPagQuery } from "@/redux/services/notificationsApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { format } from "date-fns";
import PrivateRoute from "../context/PrivateRoutes";

const Page = () => {
  const { data: brandsData } = useGetBrandsQuery(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Usamos el query que retorna { notifications: Notification[], total: number }
  const { data, error, isLoading: isQueryLoading, refetch } = useGetNotificationsPagQuery({
    page,
    limit,
    query: searchQuery,
  });

  // Referencia para el Intersection Observer (infinite scroll)
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Efecto para cargar notificaciones y acumular resultados
  useEffect(() => {
    const loadNotifications = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          // Se espera que la respuesta tenga la forma { notifications, total }
          const result = await refetch().unwrap();
          const newNotifications = result.notifications || [];
          if (page === 1) {
            setItems(newNotifications);
          } else {
            setItems((prev) => [...prev, ...newNotifications]);
          }
          // Si se recibieron tantos elementos como el límite, puede haber más
          setHasMore(newNotifications.length === limit);
        } catch (error) {
          console.error("Error loading notifications:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();
  }, [page, searchQuery]);

  // Efecto para el infinite scroll
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

  if (isQueryLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  // Mapeo de los datos usando el estado acumulado "items"
  const tableData = items.map((notification) => {
    const brand = brandsData?.find((b) => b.id === notification.brand_id);
    return {
      key: notification._id,
      brand: brand?.name,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      validity: notification.schedule_to,
      // Se formatea la fecha para que se muestre como "yyyy-MM-dd"
      date: notification.schedule_from
        ? format(new Date(notification.schedule_from), "yyyy-MM-dd")
        : "",
      download: (
        <div className="flex justify-center items-center">
          <FaDownload className="text-center text-xl" />
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
    { component: <FaDownload className="text-center text-xl" />, key: "download" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <select>
            <option value="order">TYPE</option>
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
                setPage(1);
                refetch();
              }
            }}
          />
        ),
      },
    ],
    // Si hay búsqueda se muestra la cantidad de elementos cargados,
    // de lo contrario se muestra el total según la respuesta
    results: searchQuery
      ? `${items.length} Results`
      : `${data?.total || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">NOTIFICATIONS</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        {/* Elemento para el Infinite Scroll */}
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
