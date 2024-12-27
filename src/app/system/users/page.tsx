"use client";
import Header from "@/app/components/components/Header";
import Input from "@/app/components/components/Input";
import Modal from "@/app/components/components/Modal";
import Table from "@/app/components/components/Table";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import {
  useCountUsersQuery,
  useGetUsersPagQuery,
} from "@/redux/services/usersApi";
import React, { useState, useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa6";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import UpdateUserComponent from "./UpdateUser";
import DeleteUserComponent from "./DeleteUser";
import CreateUserComponent from "./CreateUser";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: branchData } = useGetBranchesQuery(null);
  const { data, error, isLoading, refetch } = useGetUsersPagQuery({
    page,
    limit,
    query: searchQuery,
  });
  const { data: countUsersData } = useCountUsersQuery(null);

  useEffect(() => {
    if (data) {
      const newTableData = data.map((user) => {
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
            <div className="flex justify-center items-center">
              <FaPencil
                className="text-center text-lg hover:cursor-pointer"
                onClick={() => openUpdateModal(user._id)}
              />
            </div>
          ),
          erase: (
            <div className="flex justify-center items-center">
              <FaTrashCan
                className="text-center text-lg hover:cursor-pointer"
                onClick={() => openDeleteModal(user._id)}
              />
            </div>
          ),
        };
      });

      setTableData((prevData) => [...prevData, ...newTableData]);
    }
  }, [data, branchData]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => {
      if (bottomRef.current) {
        observer.unobserve(bottomRef.current);
      }
    };
  }, [isFetching]);

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
        content: (
          <Input
            placeholder={"Search..."}
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                setTableData([]);
                setPage(1);
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: searchQuery
      ? `${data?.length || 0} Results`
      : `${countUsersData || 0} Results`,
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
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

        {/* Scroll Trigger */}
        <div ref={bottomRef} className="h-10"></div>
      </div>
    </PrivateRoute>
  );
};

export default Page;
