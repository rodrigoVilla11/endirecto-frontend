"use client";
import React, { useEffect, useRef, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import {
  useCountCustomersQuery,
  useGetCustomersQuery,
} from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import {
  useGetDocumentsPagQuery,
  useGetDocumentsQuery,
} from "@/redux/services/documentsApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import { useClient } from "@/app/context/ClientContext";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const { selectedClientId } = useClient();
  const [customer_id, setCustomer_id] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const { data, error, isLoading, refetch } = useGetDocumentsPagQuery({
    page,
    limit,
    query: searchQuery,
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
    customer_id,
  });

  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch;
    } else {
      setCustomer_id("");
      refetch;
    }
  }, [selectedClientId]);
  const { data: countDocumentsData } = useCountCustomersQuery(null);

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
  }, [page]);

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

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = items?.map((document) => {
    const customer = customersData?.find(
      (data) => data.id == document.customer_id
    );
    const seller = sellersData?.find((data) => data.id == document.seller_id);

    return {
      key: document.id,
      id: (
        <div className="flex justify-center items-center">
          <IoInformationCircleOutline className="text-center text-xl" />
        </div>
      ),
      customer: customer ? `${customer?.id} - ${customer?.name}` : "NOT FOUND",
      type: document.type,
      number: document.number,
      date: document.date,
      amount: document.amount,
      balance: document.amount,
      expiration: document.expiration_date,
      logistic: document.expiration_status,
      seller: seller?.name || "NOT FOUND",
    };
  });

  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Type", key: "type" },
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Amount", key: "amount" },
    { name: "Balance", key: "balance" },
    { name: "Expiration", key: "expiration" },
    { name: "Logistic", key: "logistic" },
    { name: "Seller", key: "seller" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
    ],
    filters: [
      {
        content: (
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Date From"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      {
        content: (
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="Date To"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
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
      ? `${data?.length || 0} Results`
      : `${countDocumentsData || 0} Results`,
  };

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
        <h3 className="font-bold p-4">VOUCHERS</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
