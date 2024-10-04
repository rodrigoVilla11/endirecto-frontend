"use client";
import React, { useState } from "react";
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

  const filterBy = "headers";
  const {
    data: marketing,
    error,
    isLoading,
    refetch,
  } = useGetMarketingByFilterQuery({ filterBy, page, limit });

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

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData =
    marketing?.map((popup) => {
      return {
        key: popup._id,
        name: popup.headers.name,
        sequence: popup.headers.sequence,
        enable: popup.headers.enable ? "true" : "false",
        homeWeb:
          (
            <div className="flex justify-center items-center">
              <img src={popup.headers.homeWeb && popup.headers.homeWeb} className="h-10"/>
            </div>
          ) || "NOT FOUND",
        headerWeb:
          (
            <div className="flex justify-center items-center">
              <img className="h-10" src={popup.headers.headerWeb && popup.headers.headerWeb} />
            </div>
          ) || "NOT FOUND",
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
    { name: "Header Web", key: "headerWeb" },
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

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countMarketingData || 0) / limit)) {
      setPage(page + 1);
    }
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
        <div className="flex justify-between items-center p-4">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <p>
            Page {page} of {Math.ceil((countMarketingData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countMarketingData || 0) / limit)}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default Page;
