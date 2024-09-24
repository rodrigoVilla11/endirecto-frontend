"use client";
import Header from "@/app/components/components/Header";
import Input from "@/app/components/components/Input";
import Modal from "@/app/components/components/Modal";
import Table from "@/app/components/components/Table";
import {
  useGetBranchByIdQuery,
  useGetBranchesQuery,
} from "@/redux/services/branchesApi";
import {
  useCountUsersQuery,
  useGetUsersPagQuery,
} from "@/redux/services/usersApi";
import React, { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import UpdateUserComponent from "./UpdateUser";
import DeleteUserComponent from "./DeleteUser";
import CreateUserComponent from "./CreateUser";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { data: branchData } = useGetBranchesQuery(null);
  const { data, error, isLoading, refetch } = useGetUsersPagQuery({
    page,
    limit,
  });
  const { data: countUsersData } = useCountUsersQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const openUpdateModal = (id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentUserId(encodedId);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentUserId(null);
    refetch();
  };

  const openDeleteModal = (id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentUserId(encodedId);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentUserId(null);
    refetch();
  };

  const tableData = data?.map((user) => {
    const branch = branchData?.find((data) => data.id == user.branch);
    return {
      key: user._id,
      id: user._id,
      name: user.username,
      email: user.email,
      role: user.role,
      branch: branch?.name,
      zone: user.zone ? user.zone : "No Zone",
      edit: (
        <FaPencil
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => openUpdateModal(user._id)}
        />
      ),
      erase: (
        <FaTrashCan
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => openDeleteModal(user._id)}
        />
      ),
    };
  });
  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "User", key: "user" },
    { name: "Email", key: "email" },
    { name: "Role", key: "role" },
    { name: "Branch", key: "branch" },
    { name: "Zone", key: "zone" },
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
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: `${countUsersData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countUsersData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <div className="gap-4">
      <h3 className="text-bold p-4">USERS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData} />

      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateUserComponent closeModal={closeCreateModal} />
      </Modal>

      <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
        {currentUserId && (
          <UpdateUserComponent
          userId={currentUserId}
            closeModal={closeUpdateModal}
          />
        )}
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <DeleteUserComponent
          userId={currentUserId || ""}
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
          Page {page} of {Math.ceil((countUsersData || 0) / limit)}
        </p>
        <button
          onClick={handleNextPage}
          disabled={page === Math.ceil((countUsersData || 0) / limit)}
          className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Page;
