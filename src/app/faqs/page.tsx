"use client";
import React, { useState, useEffect, useRef } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetFaqsPagQuery } from "@/redux/services/faqsApi";
import PrivateRoute from "../context/PrivateRoutes";
import { useTranslation } from "react-i18next";

const Page = () => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Se asume que el query retorna un objeto con { faqs: Faq[], total: number }
  // Si solo retorna un arreglo, se usa el array directamente.
  const { data, error, isLoading: isQueryLoading, refetch } = useGetFaqsPagQuery({
    page,
    limit,
    query: searchQuery,
  });

  // Ref para el Intersection Observer (infinite scroll)
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Efecto para cargar FAQs y acumular los resultados
  useEffect(() => {
    const loadFaqs = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          // Si el endpoint retorna un objeto con 'faqs', se usa esa propiedad; de lo contrario se asume que result es un array.
          const newFaqs = result.faqs || result;
          if (page === 1) {
            setItems(newFaqs);
          } else {
            setItems((prev) => [...prev, ...newFaqs]);
          }
          // Se determina si hay más datos basándose en el número de elementos recibidos.
          setHasMore(newFaqs.length === limit);
        } catch (err) {
          console.error("Error loading FAQs:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadFaqs();
  }, [page, searchQuery]);

  // Efecto para implementar infinite scroll con Intersection Observer
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

  const tableData = items.map((faq) => ({
    key: faq._id,
    question: faq.question,
    answer: faq.answer,
  }));

  const tableHeader = [
    { name: t("table.question"), key: "question", important: true },
    { name: t("table.answer"), key: "answer" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <Input
            placeholder={t("page.searchPlaceholder")}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              // Reiniciamos la página al cambiar la búsqueda
              setPage(1);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                setPage(1);
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: searchQuery
      ? t("page.results", { count: items.length })
      : t("page.results", { count: data?.total || items.length }),
  };

  if (isQueryLoading && page === 1) return <p>{t("page.loading")}</p>;
  if (error) return <p>{t("page.error")}</p>;

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
        <h3 className="font-bold p-4">{t("page.faqsTitle")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        {/* Elemento observado para disparar la carga de la siguiente página */}
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
