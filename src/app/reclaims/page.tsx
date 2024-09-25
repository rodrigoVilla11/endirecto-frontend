"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { AiOutlineDownload } from "react-icons/ai";
import { FaPlus } from "react-icons/fa";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import {
  useCountReclaimsQuery,
  useGetReclaimsPagQuery,
  useGetReclaimsQuery,
} from "@/redux/services/reclaimsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetUsersQuery } from "@/redux/services/usersApi";
import Modal from "../components/components/Modal";
import CreateReclaimComponent from "./CreateReclaim";
import DeleteReclaim from "./DeleteReclaim";
import UpdateReclaimComponent from "./UpdateReclaim";
import PrivateRoute from "../context/PrivateRoutes";
// import UpdateReclaimComponent from "./UpdateReclaim";

const Page = () => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentReclaimId, setCurrentReclaimId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data: branchData } = useGetBranchesQuery(null);
  const { data: customerData } = useGetCustomersQuery(null);
  const { data: userData } = useGetUsersQuery(null);
  const { data, error, isLoading, refetch } = useGetReclaimsPagQuery({
    page,
    limit,
  });
  const { data: countReclaimsData } = useCountReclaimsQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const openUpdateModal = (id: string) => {
    setCurrentReclaimId(id);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentReclaimId(null);
    refetch();
  };

  const openDeleteModal = (id: string) => {
    setCurrentReclaimId(id);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCurrentReclaimId(null);
    refetch();
  };

  const tableData = data?.map((reclaim) => {
    const branch = branchData?.find((data) => data.id == reclaim.branch_id);
    const customer = customerData?.find(
      (data) => data.id == reclaim.customer_id
    );
    const user = userData?.find((data) => data._id == reclaim.user_id);

    return {
      key: reclaim._id,
      info: <IoInformationCircleOutline className="text-center text-xl" />,
      id: reclaim._id,
      status: reclaim.status,
      type: reclaim.reclaims_type_id,
      description: reclaim.description,
      customer: customer?.name,
      user: user?.username,
      branch: branch?.name,
      data: reclaim.date,
      edit: (
        <FaPencil
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => openUpdateModal(reclaim._id)}
        />
      ),
      erase: (
        <FaTrashCan
          className="text-center text-lg hover:cursor-pointer"
          onClick={() => openDeleteModal(reclaim._id)}
        />
      ),
    };
  });
  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Number", key: "number" },
    { name: "Status", key: "status" },
    { name: "Type", key: "type" },
    { name: "Description", key: "description" },
    { name: "Customer", key: "customer" },
    { name: "User", key: "user" },
    { name: "Branch", key: "branch" },
    { name: "Date", key: "date" },
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
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
    ],
    filters: [
      {
        content: <Input placeholder={"Date From dd/mm/aaaa"} />,
      },
      {
        content: <Input placeholder={"Date To dd/mm/aaaa"} />,
      },
      {
        content: (
          <select>
            <option value="order">STATUS</option>
          </select>
        ),
      },
      {
        content: (
          <select>
            <option value="order">TYPE</option>
          </select>
        ),
      },
      {
        content: <Input placeholder={"Number"} />,
      },
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: `${countReclaimsData || 0} Results`,
  };
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countReclaimsData || 0) / limit)) {
      setPage(page + 1);
    }
  };
  return (
    <PrivateRoute>
      <div className="gap-4">
        <h3 className="font-bold p-4">RECLAIMS</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateReclaimComponent closeModal={closeCreateModal} />
        </Modal>

        <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
          {currentReclaimId && (
            <UpdateReclaimComponent
              reclaimId={currentReclaimId}
              closeModal={closeUpdateModal}
            />
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <DeleteReclaim
            reclaimId={currentReclaimId || ""}
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
            Page {page} of {Math.ceil((countReclaimsData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countReclaimsData || 0) / limit)}
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
