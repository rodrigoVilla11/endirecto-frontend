"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil } from "react-icons/fa6";
import {
  useCountBrandsQuery,
  useGetBrandsPagQuery,
} from "@/redux/services/brandsApi";
import Modal from "@/app/components/components/Modal";
import UpdateBrandComponent from "./UpdateBrand";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [brands, setBRands] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data, error, isLoading, refetch } = useGetBrandsPagQuery({
    page,
    limit,
    query: searchQuery,
  });
  const { data: countBrandsData } = useCountBrandsQuery(null);

  // Cargar más artículos cuando cambia la página
  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const newBrands = result.data || []; // Garantiza que siempre sea un array
          setBRands((prev) => [...prev, ...newBrands]);
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

  const openUpdateModal = (id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentBrandId(encodedId);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentBrandId(null);
    refetch();
  };

  const tableData = brands?.map((brand) => ({
    key: brand.id,
    id: brand.id,
    name: brand.name,
    image: (
      <div className="flex justify-center items-center">
        <img
          src={(brand.images && brand.images[0]) || "NOT FOUND"}
          className="h-10"
        />
      </div>
    ),
    sequence: brand.sequence,
    edit: (
      <div className="flex justify-center items-center">
        <FaPencil
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => openUpdateModal(brand.id)}
        />
      </div>
    ),
  }));
  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Sequence", key: "sequence" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
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
      ? `${brands?.length || 0} Results`
      : `${countBrandsData || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">BRANDS</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
          {currentBrandId && (
            <UpdateBrandComponent
              brandId={currentBrandId}
              closeModal={closeUpdateModal}
            />
          )}
        </Modal>
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
