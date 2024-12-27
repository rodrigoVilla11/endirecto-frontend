"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaPlus } from "react-icons/fa";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import Modal from "@/app/components/components/Modal";
import {
  useCountMarketingQuery,
  useGetMarketingByFilterQuery,
} from "@/redux/services/marketingApi";
import DeleteBannerComponent from "./DeleteBanner";
import UpdateBannerComponent from "./UpdateBanner";
import CreateBannerComponent from "./CreateBanner";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentMarketingId, setCurrentMarketingId] = useState<string | null>(
    null
  );
  const [items, setItems] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const filterBy = "headers";
  const {
    data: marketing,
    error,
    isLoading,
    refetch,
  } = useGetMarketingByFilterQuery({ filterBy, page, limit });

  const { data: countMarketingData } = useCountMarketingQuery(null);

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

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const openUpdateModal = (id: string) => {
    setCurrentMarketingId(id);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentMarketingId(null);
    refetch();
  };

  const openDeleteModal = (id: string) => {
    setCurrentMarketingId(id);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentMarketingId(null);
    refetch();
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData =
    items?.map((popup) => {
      return {
        key: popup._id,
        name: popup.headers.name,
        sequence: popup.headers.sequence,
        enable: popup.headers.enable ? "true" : "false",
        homeWeb: (
          <div className="flex justify-center items-center">
            <img
              src={popup.headers.homeWeb && popup.headers.homeWeb}
              className="h-10"
            />
          </div>
        ),
        url: popup.headers.url,
        edit: (
          <div className="flex justify-center items-center">
            <FaPencil
              className="text-center text-lg hover:cursor-pointer"
              onClick={() => openUpdateModal(popup._id)}
            />
          </div>
        ),
        erase: (
          <div className="flex justify-center items-center">
            <FaTrashCan
              className="text-center text-lg hover:cursor-pointer"
              onClick={() => openDeleteModal(popup._id)}
            />
          </div>
        ),
      };
    }) || [];

  const tableHeader = [
    { name: "Name", key: "name" },
    { name: "Sequence", key: "sequence" },
    { name: "Enable", key: "enable" },
    { name: "Home Web", key: "homeWeb" },
    { name: "URL", key: "url" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "New",
        onClick: openCreateModal,
      },
    ],
    filters: [],
    results: `${marketing?.length} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "MARKETING"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">BANNERS</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateBannerComponent closeModal={closeCreateModal} />
        </Modal>

        <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
          {currentMarketingId && (
            <UpdateBannerComponent
              marketingId={currentMarketingId}
              closeModal={closeUpdateModal}
            />
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteBannerComponent
            marketingId={currentMarketingId || ""}
            closeModal={closeDeleteModal}
          />
        </Modal>
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
