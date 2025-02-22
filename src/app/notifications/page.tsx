"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { FaTimes as FaTimes } from "react-icons/fa"; // Cruz roja
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetNotificationsPagQuery } from "@/redux/services/notificationsApi";
import { useGetAllArticlesQuery } from "@/redux/services/articlesApi";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Estados para paginación, búsqueda, ordenamiento y modales
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // "field:asc" o "field:desc"
  const [items, setItems] = useState<any[]>([]);
  const [totalNotifications, setTotalNotifications] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const { data: branchData } = useGetBranchesQuery(null);
  const { data: articleData } = useGetAllArticlesQuery(null);

  // Usamos siempre useGetNotificationsPagQuery
  const { data, error, isLoading, refetch } = useGetNotificationsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
  });

  // Búsqueda con debounce
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, 100);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!isFetching) {
        setIsFetching(true);
        try {
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
          console.error(t("page.fetchError"), err);
        } finally {
          setIsFetching(false);
        }
      }
    };
    loadNotifications();
  }, [page, searchQuery, sortQuery, refetch, isFetching, t]);

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

  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

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

  const tableData = items.map((notification) => {
    const branch = branchData?.find((b) => b.id === notification.brand_id);
    const article = articleData?.find((b) => b.id === notification.article_id);
    return {
      key: notification._id,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      brand: branch?.name || t("table.noBrand"),
      article: article?.name || t("table.noBrand"),
    };
  });

  const tableHeader = [
    { name: t("table.type"), key: "type" },
    { name: t("table.title"), key: "title" },
    { name: t("table.description"), key: "description" },
    { name: t("table.brand"), key: "brand" },
    { name: t("table.article"), key: "article" },
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
      ? `${items.length} ${t("header.results")}`
      : `${totalNotifications} ${t("header.results")}`,
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
          onSort={handleSort}
          sortField={sortQuery.split(":")[0]}
          sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
        />
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
