"use client";
import React, { useEffect, useRef, useState } from "react";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import { FaPlus } from "react-icons/fa";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import {
  useCountMarketingQuery,
  useGetMarketingByFilterQuery,
} from "@/redux/services/marketingApi";
import CreatePopupComponent from "./CreatePopup";
import UpdatePopupComponent from "./UpdatePopup";
import DeletePopupComponent from "./DeletePopup";
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentMarketingId, setCurrentMarketingId] = useState<string | null>(null);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const filterBy = "popups";
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
    marketing?.map((popup) => {
      return {
        key: popup._id,
        name: popup.popups.name,
        sequence: popup.popups.sequence,
        location: popup.popups.location,
        enable: popup.popups.enable ? t("table.enabled") : t("table.disabled"),
        web: (
          <div className="flex justify-center items-center">
            <img
              src={popup.popups.web || ""}
              className="h-10"
              alt={t("table.imageAlt")}
            />
          </div>
        ),
        url: popup.popups.url,
        visualization: popup.popups.visualization,
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
    { name: t("table.name"), key: "name", important: true },
    { name: t("table.sequence"), key: "sequence" },
    { name: t("table.location"), key: "location", important: true },
    { name: t("table.enable"), key: "enable", important: true },
    { name: t("table.web"), key: "web", important: true },
    { name: t("table.url"), key: "url" },
    { name: t("table.visualizations"), key: "visualization" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
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
        <h3 className="font-bold p-4">{t("page.popups")}</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />
        <div ref={observerRef} className="h-10" />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreatePopupComponent closeModal={closeCreateModal} />
        </Modal>

        <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
          {currentMarketingId && (
            <UpdatePopupComponent
              marketingId={currentMarketingId}
              closeModal={closeUpdateModal}
            />
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeletePopupComponent
            marketingId={currentMarketingId || ""}
            closeModal={closeDeleteModal}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;
