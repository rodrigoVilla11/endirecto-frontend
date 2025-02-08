"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa6";
import {
  useCountArticleVehicleQuery,
  useGetArticlesVehiclesPagQuery,
} from "@/redux/services/articlesVehicles";
import {
  useGetAllArticlesQuery,
  useGetArticlesQuery,
  useSyncEquivalencesMutation,
} from "@/redux/services/articlesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useGetArticlesEquivalencesQuery } from "@/redux/services/articlesEquivalences";
import Modal from "@/app/components/components/Modal";
import { FaPlus } from "react-icons/fa";
import { AiFillFileExcel } from "react-icons/ai";
import { IoSync } from "react-icons/io5";
import { useGetTechnicalDetailsQuery } from "@/redux/services/technicalDetails";
import CreateTechnicalDetailsModal from "./CreateTechincalDetail";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [technicalDetails, setTechnicalDetails] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data, error, isLoading, refetch } = useGetTechnicalDetailsQuery({
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
          setTechnicalDetails((prev) => [...prev, ...newBrands]);
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

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };



  const tableData = technicalDetails?.map((item) => {
    return {
      id: item.id,
      name: item.name
    };
  });

  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
  ];
  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: "New", onClick: openCreateModal },
    ],
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
    results:  `${technicalDetails?.length || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">Technical Details</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={observerRef} className="h-10" />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateTechnicalDetailsModal closeModal={closeCreateModal} />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
