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
import { useTranslation } from "react-i18next";

const Page = () => {
  const { t } = useTranslation();
  const { data: brandsData } = useGetBrandsQuery(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { data, error, isLoading: isQueryLoading, refetch } = useGetNotificationsPagQuery({
    page,
    limit,
    query: searchQuery,
  });

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newNotifications = result.notifications || [];
          if (page === 1) {
            setItems(newNotifications);
          } else {
            setItems((prev) => [...prev, ...newNotifications]);
          }
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

  if (isQueryLoading) return <p>{t("loading")}</p>;
  if (error) return <p>{t("error_loading")}</p>;

  const tableData = items.map((notification) => {
    const brand = brandsData?.find((b) => b.id === notification.brand_id);
    return {
      key: notification._id,
      brand: brand?.name,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      validity: notification.schedule_to,
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
    { name: t("brand"), key: "brand" },
    { name: t("type"), key: "type" },
    { name: t("title"), key: "title" },
    { name: t("description"), key: "description" },
    { name: t("validity"), key: "validity" },
    { name: t("date"), key: "date" },
    { component: <FaDownload className="text-center text-xl" />, key: "download" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <select>
            <option value="order">{t("type")}</option>
          </select>
        ),
      },
      {
        content: (
          <Input
            placeholder={t("search_placeholder")}
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
    results: searchQuery ? `${items.length} ${t("results")}` : `${data?.total || 0} ${t("results")}`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("notifications")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
