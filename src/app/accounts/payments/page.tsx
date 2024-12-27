"use client";
import React, { useEffect, useRef, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { MdOutlineEmail } from "react-icons/md";
import { FaRegFilePdf } from "react-icons/fa6";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import {
  useCountCollectionQuery,
  useGetCollectionsPagQuery,
  useUpdateCollectionMutation,
} from "@/redux/services/collectionsApi";
import { FaPlus } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import CreatePaymentComponent from "./CreatePayment";
import { format } from "date-fns";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import { useClient } from "@/app/context/ClientContext";

enum CollectionStatus {
  PENDING = "PENDING",
  SENDED = "SENDED",
  SUMMARIZED = "SUMMARIZED",
  CHARGED = "CHARGED",
  CANCELED = "CANCELED",
}

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [updateCollection, { isLoading: isUpdating }] =
    useUpdateCollectionMutation();
  const { selectedClientId } = useClient();
  const [items, setItems] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const [customer_id, setCustomer_id] = useState("");

  const [searchParams, setSearchParams] = useState({
    status: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data, error, isLoading, refetch } = useGetCollectionsPagQuery({
    page,
    limit,
    startDate: searchParams.startDate
      ? searchParams.startDate.toISOString()
      : undefined,
    endDate: searchParams.endDate
      ? searchParams.endDate.toISOString()
      : undefined,
    status: searchParams.status,
    customer_id: customer_id,
  });

  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch;
    } else {
      setCustomer_id("");
      refetch;
    }
  }, [selectedClientId, refetch]);

  const { data: countCollectionsData } = useCountCollectionQuery(null);

   useEffect(() => {
      if (!isFetching) {
        setIsFetching(true);
        refetch()
          .then((result) => {
            const newBrands = result.data || []; // Garantiza que siempre sea un array
            setItems((prev) => [...prev, ...newBrands]);
          })
          .catch((error) => {
            console.error("Error fetching articles:", error);
          })
          .finally(() => {
            setIsFetching(false);
          });
      }
    }, [page, isFetching, refetch]);
  
    // Configurar Intersection Observer para scroll infinito
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isFetching) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 1.0 }
      );
  
      if (observerRef.current) {
        observer.observe(observerRef.current);
      }
  
      return () => {
        if (observerRef.current) {
          observer.unobserve(observerRef.current);
        }
      };
    }, [isFetching]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching collections.</p>;

  const handleChangeStatus = async (
    collectionId: string,
    newStatus: CollectionStatus
  ) => {
    try {
      await updateCollection({ _id: collectionId, status: newStatus }).unwrap();
      refetch();
    } catch (error) {
      console.error("Error updating collection status:", error);
    }
  };

  const tableData = items?.map((collection) => {
    const customer = customersData?.find(
      (data) => data.id === collection.customer_id
    );
    const seller = sellersData?.find(
      (data) => data.id === collection.seller_id
    );

    return {
      key: collection._id,
      detail: <IoInformationCircleOutline className="text-center text-xl" />,
      email: <MdOutlineEmail className="text-center text-xl" />,
      pdf: <FaRegFilePdf className="text-center text-xl" />,
      customer: customer ? `${customer.id} - ${customer.name}` : "NOT FOUND",
      number: collection.number,
      date: collection.date
        ? format(new Date(collection.date), "dd/MM/yyyy HH:mm")
        : "N/A",
      amount: collection.amount,
      status: collection.status,
      changeStatus: (
        <select
          value={collection.status}
          onChange={(e) =>
            handleChangeStatus(
              collection._id,
              e.target.value as CollectionStatus
            )
          }
        >
          <option value="">Change Status</option>
          {Object.values(CollectionStatus).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      ),
      seller: seller?.name || "NOT FOUND",
    };
  });

  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    {
      component: <MdOutlineEmail className="text-center text-xl" />,
      key: "mail",
    },
    { component: <FaRegFilePdf className="text-center text-xl" />, key: "pdf" },
    { name: "Customer", key: "customer" },
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Amount", key: "amount" },
    { name: "Status", key: "status" },
    { name: "Change Status", key: "change-status" },
    { name: "Seller", key: "seller" },
  ];

  const headerBody = {
    buttons: [
      { logo: <FaPlus />, title: "New", onClick: openCreateModal },
      { logo: <AiOutlineDownload />, title: "Download" },
    ],
    filters: [
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
            {Object.values(CollectionStatus).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        ),
      },
      ,
    ],
    results: `${data?.length || 0} Results`,
  };

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">PAYMENTS</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
          <CreatePaymentComponent closeModal={closeCreateModal} />
        </Modal>
        <div ref={observerRef} className="h-10" />
F
      </div>
    </PrivateRoute>
  );
};

export default Page;
