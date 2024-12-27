"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import {
  useCountPaymentConditionsQuery,
  useGetPaymentConditionsPagQuery,
} from "@/redux/services/paymentConditionsApi";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: countPaymentConditionsData } =
    useCountPaymentConditionsQuery(null);
  const [paymentConditions, setPaymentConditions] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const { data, error, isLoading, refetch } = useGetPaymentConditionsPagQuery({
    page,
    limit,
    query: searchQuery,
  });

  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const newBrands = result.data || []; // Garantiza que siempre sea un array
          setPaymentConditions((prev) => [...prev, ...newBrands]);
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
  const tableData = paymentConditions?.map((payment_condition) => ({
    key: payment_condition.id,
    id: payment_condition.id,
    name: payment_condition.name,
    percentage: payment_condition.percentage,
    default: payment_condition.default,
  }));
  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    { name: "Percentage", key: "percentage" },
    { name: "Default", key: "default" },
  ];
  const headerBody = {
    buttons: [],
    filters: [
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
      : `${countPaymentConditionsData || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">PAYMENT CONDITIONS</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
