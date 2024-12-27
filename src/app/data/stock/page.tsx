"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import {
  useCountStockQuery,
  useGetStockPagQuery,
} from "@/redux/services/stockApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: countStockData } = useCountStockQuery(null);
  const [stock, setStock] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data: branchData } = useGetBranchesQuery(null);
  const { data, error, isLoading, refetch } = useGetStockPagQuery({
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
          setStock((prev) => [...prev, ...newBrands]);
        })
        .catch((error) => {
          console.error("Error fetching articles:", error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [page, searchQuery]);

    useEffect(() => {
          setPage(1); // Reinicia la paginación
          setStock([]); // Limpia los datos anteriores
        }, [searchQuery]);
  
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

  const tableData = stock?.map((stock) => {
    const branch = branchData?.find((data) => data.id == stock.branch_id);
    return {
      key: stock.id,
      id: stock.id,
      article_id: stock.article_id,
      quantity: stock.quantity,
      branch: branch?.name,
      quantity_next: stock.quantity_next,
      quantity_next_date: stock.quantity_next_date,
    };
  });

  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Article", key: "article" },
    { name: "Quantity", key: "quantity" },
    { name: "Branch", key: "branch" },
    { name: "Next Entry", key: "next-entry" },
    { name: "Date Next Entry", key: "date-next-entry" },
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
      : `${countStockData || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">STOCK</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
