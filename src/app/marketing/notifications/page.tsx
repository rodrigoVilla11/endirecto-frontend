"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaPlus, FaTrashCan } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import {
  useGetNotificationsPagQuery,
} from "@/redux/services/notificationsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import debounce from "@/app/context/debounce";
import CreateNotificationComponent from "./CreateNotification";
import DeleteNotificationComponent from "./DeleteNotification";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();
  // States for pagination, search, sorting and modals
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Format: "field:asc" or "field:desc"
  // "items" will hold the notifications (concatenated)
  const [items, setItems] = useState<any[]>([]);
  // Global total returned by the endpoint
  const [totalNotifications, setTotalNotifications] = useState<number>(0);
  // For infinite scroll
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  // Modal state for deletion (we open the delete modal when a notification is selected)
  const [currentNotificationId, setCurrentNotificationId] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // Ref for Intersection Observer (infinite scroll)
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Other queries
  const { data: branchData } = useGetBranchesQuery(null);
  // useGetNotificationsPagQuery is expected to return an object { notifications, total }
  const { data, error, isLoading, refetch } = useGetNotificationsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
  });

  // Debounced search to avoid firing with every keystroke
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, 100);

  // Effect to load notifications (pagination, search, infinite scroll)
  useEffect(() => {
    const loadNotifications = async () => {
      if (!isFetching) {
        setIsFetching(true);
        try {
          // Expected response: { notifications: Notification[], total: number }
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

  // Intersection Observer for infinite scroll
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

  // Reset search handler
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  // Sorting handler
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

  // Map notifications to table data
  const tableData = items.map((notification) => {
    const branch = branchData?.find((b) => b.id === notification.branch_id);
    return {
      key: notification._id,
      brand: branch?.name || t("table.noBrand"),
      type: notification.type,
      title: notification.title,
      description: notification.description,
      validity: notification.schedule_to,
      date: notification.schedule_from,
      erase: (
        <div className="flex justify-center items-center">
          <FaTrashCan
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => setCurrentNotificationId(notification._id)}
          />
        </div>
      ),
    };
  });

  const tableHeader = [
    { name: t("table.brand"), key: "brand" },
    { name: t("table.type"), key: "type" },
    { name: t("table.title"), key: "title" },
    { name: t("table.description"), key: "description" },
    { name: t("table.validity"), key: "validity" },
    { name: t("table.date"), key: "date" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  // Header configuration: if there's a search query, show local count; otherwise, use global total
  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: t("header.new"),
        onClick: () => setCreateModalOpen(true),
      },
    ],
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

        {/* Modal for creating notification */}
        <Modal isOpen={isCreateModalOpen} onClose={() => {
          setCreateModalOpen(false);
          setPage(1);
          setItems([]);
          refetch();
        }}>
          <CreateNotificationComponent closeModal={() => {
            setCreateModalOpen(false);
            setPage(1);
            setItems([]);
            refetch();
          }} />
        </Modal>

        {/* Modal for deleting notification */}
        <Modal isOpen={currentNotificationId !== null} onClose={() => {
          setCurrentNotificationId(null);
          setPage(1);
          setItems([]);
          refetch();
        }}>
          <DeleteNotificationComponent
            notificationId={currentNotificationId || ""}
            closeModal={() => {
              setCurrentNotificationId(null);
              setPage(1);
              setItems([]);
              refetch();
            }}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
