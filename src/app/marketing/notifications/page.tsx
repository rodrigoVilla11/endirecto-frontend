"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaPlus } from "react-icons/fa";
import {
  NotificationType,
  useCountNotificationsQuery,
  useGetNotificationsPagQuery,
} from "@/redux/services/notificationsApi";
import { format } from "date-fns";
import { FaTrashCan } from "react-icons/fa6";
import Modal from "@/app/components/components/Modal";
import CreateNotificationComponent from "./CreateNotification";
import DeleteNotificationComponent from "./DeleteNotification";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationType, setNotificationType] = useState<NotificationType | undefined>(undefined)
  const { data: countNotificationsData } = useCountNotificationsQuery(null);
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
  } = useGetNotificationsPagQuery({
    page,
    limit,
    query: searchQuery,
    type: notificationType,
  }); // Agregar type aquí

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

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as NotificationType | "all"; 
    setNotificationType(value === "all" ? undefined : value);
    setPage(1); 
    refetch(); 
  };
  
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData =
    notifications?.map((notification) => {
      const brand = brandsData?.find(
        (data: any) => data.id === notification.brand_id
      );
      return {
        key: notification._id,
        brand: brand?.name || "N/A",
        type: notification.type,
        title: notification.title,
        description: notification.description,
        validity: notification.schedule_to,
        date: notification.schedule_from,

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
          <select onChange={handleFilterChange} value={notificationType}>
            <option value="all">TYPE</option>
            {Object.entries(NotificationType).map(([key, value]) => (
              <option key={key} value={key}>
                {value.toUpperCase()}
              </option>
            ))}
          </select>
        ),
      },
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
      ? `${notifications?.length || 0} Results`
      : `${countNotificationsData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countNotificationsData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <PrivateRoute>
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
        <div className="flex justify-between items-center p-4">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <p>
            Page {page} of {Math.ceil((countNotificationsData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countNotificationsData || 0) / limit)}
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
