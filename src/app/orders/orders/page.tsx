"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { FaRegFilePdf } from "react-icons/fa6";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useClient } from "@/app/context/ClientContext";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetOrdersPagQuery } from "@/redux/services/ordersApi";
import DatePicker from "react-datepicker";
import { FaTimes } from "react-icons/fa";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [customer_id, setCustomer_id] = useState("");
  const [sortQuery, setSortQuery] = useState<string>("");

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { selectedClientId } = useClient();

  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  function formatDate(date: Date) {
    return format(date, "yyyy-MM-dd");
  }

  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetOrdersPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      startDate: startDate ? formatDate(startDate) : undefined,
      endDate: endDate ? formatDate(endDate) : undefined,
      customer_id,
      sort: sortQuery,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch();
    } else {
      setCustomer_id("");
      refetch();
    }
  }, [selectedClientId, refetch, isLoading]);

  useEffect(() => {
    const loadDocuments = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newDocuments = Array.isArray(result) ? result : result.orders || [];

          if (page === 1) {
            setItems(newDocuments);
          } else {
            setItems((prev) => [...prev, ...newDocuments]);
          }

          setHasMore(newDocuments.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading documents:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadDocuments();
  }, [page, searchQuery, startDate, endDate, customer_id, sortQuery, isLoading, refetch]);

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

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("orders")}</h3>
        <Header headerBody={{ results: `${data?.total || 0} ${t("results")}` }} />
        <Table headers={[]} data={items} />
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
