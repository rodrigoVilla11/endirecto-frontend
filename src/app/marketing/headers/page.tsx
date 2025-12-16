"use client";
import React, { useEffect, useRef, useState } from "react";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaPlus } from "react-icons/fa";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import Modal from "@/app/components/components/Modal";
import {
  useCountMarketingQuery,
  useGetMarketingByFilterQuery,
} from "@/redux/services/marketingApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import CreateHeaderComponent from "./CreateHeader";
import UpdateHeaderComponent from "./UpdateHeader";
import DeleteHeaderComponent from "./DeleteHeader";
import { useTranslation } from "react-i18next";
import { IoIosTrash } from "react-icons/io";
import { GoPencil } from "react-icons/go";

const Page = () => {
  const { t } = useTranslation();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentMarketingId, setCurrentMarketingId] = useState<string | null>(
    null
  );

  const filterBy = "header";

  const observerRef = useRef<HTMLDivElement | null>(null);
  const {
    data: marketing,
    error,
    isLoading,
    refetch,
  } = useGetMarketingByFilterQuery({ filterBy });
  const { data: countMarketingData } = useCountMarketingQuery(null);

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

  if (isLoading) return <p>{t("page.loading")}</p>;
  if (error) return <p>{t("page.error")}</p>;

  const tableData =
    marketing?.map((item) => ({
      key: item._id,
      enable: item.header.enable ? t("table.enabled") : t("table.disabled"),
      img: (
        <div className="flex justify-center items-center">
          <img
            src={item.header.img || ""}
            className="h-10"
            alt={t("table.imageAlt")}
          />
        </div>
      ),
      url: item.header.url,
      edit: (
        <div className="flex justify-center items-center">
          <GoPencil
            className="text-center font-bold text-3xl text-white hover:cursor-pointer hover:text-black bg-green-400  p-1.5 rounded-sm"
            onClick={() => openUpdateModal(item._id)}
          />
        </div>
      ),
      erase: (
        <div className="flex justify-center items-center">
          <IoIosTrash
            className="text-center text-3xl text-white hover:cursor-pointer hover:text-black bg-red-400  p-1.5 rounded-sm"
            onClick={() => openDeleteModal(item._id)}
          />
        </div>
      ),
    })) || [];

  const tableHeader = [
    { name: t("table.enable"), key: "enable", important: true },
    { name: t("table.image"), key: "img", important: true },
    { name: t("table.url"), key: "url" },
    { component: <GoPencil className="text-center text-lg" />, key: "edit" },
    { component: <IoIosTrash className="text-center text-lg" />, key: "erase" },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: t("header.new"),
        onClick: openCreateModal,
      },
    ],
    filters: [],
    results: `${marketing?.length} ${t("header.results")}`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "MARKETING"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4 text-white">{t("page.headers")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateHeaderComponent closeModal={closeCreateModal} />
        </Modal>

        <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
          {currentMarketingId && (
            <UpdateHeaderComponent
              marketingId={currentMarketingId}
              closeModal={closeUpdateModal}
            />
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteHeaderComponent
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
