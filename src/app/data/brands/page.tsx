"use client";
import React, { useState } from "react";
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
  const [limit] = useState(15);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: brands,
    error,
    isLoading,
    refetch,
  } = useGetBrandsPagQuery({
    page,
    limit,
    query: searchQuery,
  });
  const { data: countBrandsData } = useCountBrandsQuery(null);

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
    image: <div className="flex justify-center items-center"><img src={brand.images && brand.images[0]} className="h-10"/></div> || "NOT FOUND",
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

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countBrandsData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <PrivateRoute  requiredRoles={["ADMINISTRADOR"]}>
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
        <div className="flex justify-between items-center p-4">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <p>
            Page {page} of {Math.ceil((countBrandsData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countBrandsData || 0) / limit)}
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
