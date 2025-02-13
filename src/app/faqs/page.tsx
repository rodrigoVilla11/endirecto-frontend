"use client";
import React, { useState, useEffect, useRef } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import {
  useGetFaqsPagQuery,
} from "@/redux/services/faqsApi";
import PrivateRoute from "../context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Se asume que el query retorna un objeto con { faqs: Faq[], total: number }
  // Si solo retorna un arreglo, la lógica detecta que no existe "faqs" y usa el array directamente.
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

  if (isQueryLoading && page === 1) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = items.map((faq) => ({
    key: faq._id,
    question: faq.question,
    answer: faq.answer,
  }));

  const tableHeader = [
    { name: "Question", key: "question", important: true },
    { name: "Answer", key: "answer" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <Input
            placeholder={"Search..."}
            value={searchQuery}
            onChange={(e: any) => {
              setSearchQuery(e.target.value);
              // Reiniciamos la página al cambiar la búsqueda
              setPage(1);
            }}
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
    // Si hay búsqueda, se muestra el número de FAQs cargadas;
    // de lo contrario se usa data.total si existe, o se muestra el total de elementos cargados.
    results: searchQuery
      ? `${items.length} Results`
      : `${data?.total || items.length} Results`,
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
        <h3 className="font-bold p-4">FAQS</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        {/* Elemento observado para disparar la carga de la siguiente página */}
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
