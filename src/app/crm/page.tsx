"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { IoMdPin } from "react-icons/io";
import ButtonOnOff from "../components/components/ButtonOnOff";
import {
  ActionType,
  StatusType,
  useCountCrmQuery,
  useGetCrmPagQuery,
  useUpdateCrmMutation,
} from "@/redux/services/crmApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetCollectionsQuery } from "@/redux/services/collectionsApi";
import PrivateRoute from "../context/PrivateRoutes";
import DatePicker from "react-datepicker";
import { FaPlus } from "react-icons/fa";
import Modal from "../components/components/Modal";
import CreateCRMComponent from "./CreateCRM";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const [contactedStates, setContactedStates] = useState<boolean[]>([]);

  const [searchParams, setSearchParams] = useState({
    status: "",
    type: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    insitu: "",
  });

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };
  console.log(searchParams);

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data: collectionData } = useGetCollectionsQuery(null);

  const { data, error, isLoading, refetch } = useGetCrmPagQuery({
    page,
    limit,
    startDate: searchParams.startDate
      ? searchParams.startDate.toISOString()
      : undefined,
    endDate: searchParams.endDate
      ? searchParams.endDate.toISOString()
      : undefined,
    type: searchParams.type,
    status: searchParams.status,
    insitu: searchParams.insitu,
  });

  const [updateCrm] = useUpdateCrmMutation();
  const { data: countCrmData } = useCountCrmQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const handleContactedToggle = (index: number | undefined, crm: any) => {
    if (index === undefined) return; // Manejar el caso en que el índice no es válido

    const newStates = [...contactedStates];
    const newState = !newStates[index]; // Alternar el estado

    // Actualizar el estado local
    newStates[index] = newState;
    setContactedStates(newStates);

    // Realizar la mutación para actualizar el CRM
    updateCrm({
      ...crm,
      insitu: newState, // Suponiendo que insitu es el campo a actualizar
    });
  };

  const handleContactedFilters = (contacted: boolean | null) => {
    setSearchParams((prev) => {
      let newInsitu;
      if (contacted === null) {
        newInsitu = "";
      } else if (contacted) {
        newInsitu = "true";
      } else {
        newInsitu = "false";
      }

      return {
        ...prev,
        insitu: newInsitu,
      };
    });
    setPage(1);
    refetch();
  };

  const tableData = data?.map((crm) => {
    const customer = customersData?.find((data) => data.id === crm.customer_id);
    const seller = sellersData?.find((data) => data.id === crm.seller_id);
    const collection = collectionData?.find(
      (data) => data._id === crm.seller_id
    );

    const index = data?.indexOf(crm);

    return {
      key: crm._id,
      info: (
        <div className="flex justify-center items-center">
          <IoInformationCircleOutline className="text-center text-xl" />
        </div>
      ),
      seller: seller?.name,
      customer: customer?.name,
      contacted: (
        <button
          onClick={() => handleContactedToggle(index, crm)}
          className={`btn ${
            contactedStates[index] ?? false ? "btn-success" : "btn-danger"
          }`}
        >
          {contactedStates[index] ?? false ? "Contacted" : "Not Contacted"}
        </button>
      ),
      type: crm.type,
      date: crm.date,
      collection: collection?.amount,
      order_id: "FALTA AGREGAR",
      amount: collection?.amount,
      status: crm.status,
      gps: crm.gps,
    };
  });

  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Seller", key: "seller" },
    { name: "Customer", key: "customer" },
    { name: "Contacted", key: "contacted" },
    { name: "Type", key: "type" },
    { name: "Date", key: "date" },
    { name: "Payment", key: "payment" },
    { name: "Order", key: "order" },
    { name: "Amount", key: "amount" },
    { name: "Status", key: "status" },
    { name: "GPS", key: "gps" },
  ];

  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: "New", onClick: openCreateModal },
      {
        logo: <IoMdPin />,
        title: "View On Map",
      },
    ],
    filters: [
      {
        content: (
          <ButtonOnOff
            title={"Contacted"}
            onChange={() =>
              handleContactedFilters(
                searchParams.insitu === "true" ? null : true
              )
            }
            active={searchParams.insitu === "true"}
          />
        ),
      },
      {
        content: (
          <ButtonOnOff
            title={"Not Contacted"}
            onChange={() =>
              handleContactedFilters(
                searchParams.insitu === "false" ? null : false
              )
            }
            active={searchParams.insitu === "false"}
          />
        ),
      },
      {
        content: (
          <DatePicker
            selected={searchParams.startDate}
            onChange={(date) =>
              setSearchParams({ ...searchParams, startDate: date })
            }
            placeholderText="Date From"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      {
        content: (
          <DatePicker
            selected={searchParams.endDate}
            onChange={(date) =>
              setSearchParams({ ...searchParams, endDate: date })
            }
            placeholderText="Date To"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      {
        content: (
          <select
            value={searchParams.status}
            onChange={(e) =>
              setSearchParams({ ...searchParams, status: e.target.value })
            }
          >
            <option value="">Status...</option>
            {Object.values(StatusType).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        ),
      },
      {
        content: (
          <select
            value={searchParams.type}
            onChange={(e) =>
              setSearchParams({ ...searchParams, type: e.target.value })
            }
          >
            <option value="">Type...</option>
            {Object.values(ActionType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        ),
      },
    ],
    results: `${countCrmData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countCrmData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <PrivateRoute>
      <div className="gap-4">
        <h3 className="font-bold p-4">CRM</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreateCRMComponent closeModal={closeCreateModal} />
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
            Page {page} of {Math.ceil((countCrmData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countCrmData || 0) / limit)}
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
