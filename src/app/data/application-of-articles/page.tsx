"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa6";
import {
  useCountArticleVehicleQuery,
  useGetArticlesVehiclesPagQuery,
  useGetArticlesVehiclesQuery,
} from "@/redux/services/articlesVehicles";
import {
  useGetAllArticlesQuery,
  useGetArticlesQuery,
} from "@/redux/services/articlesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: countArticleVehicleData } = useCountArticleVehicleQuery(null);
  const [applicationsOfArticles, setApplicationsOfArticles] = useState<any[]>(
    []
  );
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data: articlesData } = useGetAllArticlesQuery(null);
  const { data, error, isLoading, refetch } = useGetArticlesVehiclesPagQuery({
    page,
    limit,
    query: searchQuery,
  });

  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const newApplicationsOfArticles = result.data || []; // Garantiza que siempre sea un array
          setApplicationsOfArticles((prev) => [
            ...prev,
            ...newApplicationsOfArticles,
          ]);
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

  const tableData = applicationsOfArticles?.map((item) => {
    const article = articlesData?.find((data) => data.id == item.article_id);

    return {
      image: article?.images || "NOT FOUND",
      article: article?.name || "NOT FOUND",
      brand: item?.brand,
      model: item?.model,
      engine: item?.engine,
      year: item?.year,
    };
  });

  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Article", key: "article" },
    { name: "Brand", key: "brand" },
    { name: "Model", key: "model" },
    { name: "Engine", key: "engine" },
    { name: "Year", key: "year" },
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
      : `${countArticleVehicleData || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">APPLICATION OF ARTICLES</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
