"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaPlus } from "react-icons/fa";
import { useGetNotificationsQuery } from "@/redux/services/notificationsApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { format } from "date-fns";
import { FaTrashCan } from "react-icons/fa6";
import Modal from "@/app/components/components/Modal";
import CreateNotificationComponent from "./CreateNotification";
import DeleteNotificationComponent from "./DeleteNotification";

const page = () => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentNotificationId, setCurrentNotificationId] = useState<
    string | null
  >(null);

  const { data: brandsData } = useGetBrandsQuery(null);
  const {
    data: notifications,
    error,
    isLoading,
    refetch,
  } = useGetNotificationsQuery(null);

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const openDeleteModal = (id: string) => {
    setCurrentNotificationId(id);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentNotificationId(null);
    refetch();
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData =
    notifications?.map((notification) => {
      const brand = brandsData?.find(
        (data) => data.id === notification.brand_id
      );
      return {
        key: notification._id,
        brand: brand?.name || "N/A",
        type: notification.type,
        title: notification.title,
        description: notification.description,
        validity: notification.schedule_to
          ? format(new Date(notification.schedule_to), "dd/MM/yyyy HH:mm")
          : "N/A",
        date: notification.schedule_from
          ? format(new Date(notification.schedule_from), "dd/MM/yyyy HH:mm")
          : "N/A",

        erase: (
          <FaTrashCan
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openDeleteModal(notification._id)}
          />
        ),
      };
    }) || [];

  const tableHeader = [
    { name: "Brand", key: "brand" },
    { name: "Type", key: "type" },
    { name: "Title", key: "title" },
    { name: "Description", key: "description" },
    { name: "Validity", key: "validity" },
    { name: "Date", key: "date" },
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
    filters: [
      {
        content: (
          <select>
            <option value="order">TYPE</option>
          </select>
        ),
      },
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: `${notifications?.length} Results`,
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">NOTIFICATIONS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData} />

      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateNotificationComponent closeModal={closeCreateModal} />
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <DeleteNotificationComponent
          notificationId={currentNotificationId || ""}
          closeModal={closeDeleteModal}
        />
      </Modal>
    </div>
  );
};

export default page;
