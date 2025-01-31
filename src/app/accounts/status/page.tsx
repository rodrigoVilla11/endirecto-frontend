"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import {
  useCountDocumentsQuery,
  useGetDocumentsPagQuery,
  useSumAmountsQuery,
} from "@/redux/services/documentsApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useClient } from "@/app/context/ClientContext";
import { FaPlus, FaTimes } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import CreateInstanceComponent from "./CreateInstance";
import Instance from "./Instance";
import CRM from "./CRM";
import debounce from "@/app/context/debounce";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  // Basic states
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [customer_id, setCustomer_id] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { selectedClientId } = useClient();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // References
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  function formatDate(date: any) {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Redux queries
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetDocumentsPagQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      startDate: startDate ? formatDate(startDate) : undefined,
      endDate: endDate ? formatDate(endDate) : undefined,
      customer_id,
      sort: sortQuery,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const { data: countDocumentsData } = useCountDocumentsQuery(null);
  const { data: sumAmountsData } = useSumAmountsQuery(null);

  // Modal states
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setItems([]);
    setHasMore(true);
  }, 100);

  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch;
    } else {
      setCustomer_id("");
      refetch;
    }
  }, [selectedClientId]);

  // Effect for handling initial load and searches
  useEffect(() => {
    const loadDocuments = async () => {
      if (!isLoading) {
        try {
          const result = await refetch().unwrap();
          const newDocuments = result || [];

          if (page === 1) {
            setItems(newDocuments);
          } else {
            setItems((prev) => [...prev, ...newDocuments]);
          }

          setHasMore(newDocuments.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error("Error loading documents:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadDocuments();
  }, [page, searchQuery, startDate, endDate, customer_id, sortQuery]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    const currentObserver = observerRef.current;
    if (currentObserver) {
      observer.observe(currentObserver);
    }

    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver);
      }
    };
  }, [hasMore, isLoading]);

  // Reset search
  const handleResetSearch = () => {
    setSearchQuery("");
    setItems([]);
    setPage(1);
    setHasMore(true);
  };

  const handleResetDate = () => {
    setEndDate(null);
    setStartDate(null);
    setItems([]);
    setPage(1);
    setHasMore(true);
  };
  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";

      if (currentField === field) {
        // Alternar entre ascendente y descendente
        newSortQuery =
          currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        // Nuevo campo de ordenamiento, por defecto ascendente
        newSortQuery = `${field}:asc`;
      }

      setSortQuery(newSortQuery);
      setPage(1);
      setItems([]);
      setHasMore(true);
    },
    [sortQuery]
  );
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = items
    ?.filter((document) => {
      return !customer_id || document.customer_id === customer_id;
    })
    ?.map((document) => {
      const customer = customersData?.find(
        (data) => data.id == document.customer_id
      );
      const seller = sellersData?.find((data) => data.id == document.seller_id);

      return {
        key: document.id,
        id: (
          <div className="flex justify-center items-center">
            <IoInformationCircleOutline className="text-center text-xl" />
          </div>
        ),
        customer: customer
          ? `${customer?.id} - ${customer?.name}`
          : "NOT FOUND",
        type: document.type,
        number: document.number,
        date: document.date,
        amount: document.amount,
        balance: document.amount,
        expiration: document.expiration_date,
        logistic: document.expiration_status || "",
        seller: seller?.name || "NOT FOUND",
      };
    });

  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Customer", key: "customer" },
    { name: "Type", key: "type" },
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Amount", key: "amount" },
    { name: "Balance", key: "balance" },
    { name: "Expiration", key: "expiration" },
    { name: "Logistic", key: "logistic" },
    { name: "Seller", key: "seller" },
  ];

  const sumAmountsDataFilter = tableData?.reduce((acc, document) => {
    const amount = parseFloat(document.amount);
    return acc + amount;
  }, 0);
  const formatedSumAmountFilter = sumAmountsDataFilter?.toLocaleString(
    "es-ES",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
  const formatedSumAmount = sumAmountsData?.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
      { logo: <FaPlus />, title: "CRM", onClick: openCreateModal },
    ],
    filters: [
      {
        content: (
          <div>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              placeholderText="Date From"
              dateFormat="yyyy-MM-dd"
              className="border border-gray-300 rounded p-2"
            />
            {startDate && (
              <button
                className="-translate-y-1/2"
                onClick={handleResetDate}
                aria-label="Clear date"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
      {
        content: (
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="Date To"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      // {
      //   content: (
      //     <div>
      //       <Input
      //         placeholder={"Search..."}
      //         value={searchQuery}
      //         onChange={(e: any) => debouncedSearch(e.target.value)}
      //         onKeyDown={(e: any) => {
      //           if (e.key === "Enter") {
      //             refetch();
      //           }
      //         }}
      //       />
      //       {searchQuery && (
      //         <button
      //           className="-translate-y-1/2"
      //           onClick={handleResetSearch}
      //           aria-label="Clear search"
      //         >
      //           <FaTimes className="text-gray-400 hover:text-gray-600" />
      //         </button>
      //       )}
      //     </div>
      //   ),
      // },
    ],
    secondSection: {
      title: "Total Owed",
      amount: selectedClientId
        ? `$ ${formatedSumAmountFilter}`
        : `$ ${formatedSumAmount}`,
    },
    results: searchQuery
      ? `${data?.length || 0} Results`
      : `${countDocumentsData || 0} Results`,
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
        <h3 className="font-bold p-4">STATUS</h3>
        <Header headerBody={headerBody} />
        {/* <Instance selectedClientId={selectedClientId} /> */}
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0]}
          sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
        />

        <div ref={observerRef} className="h-10" />
      </div>
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CRM
          closeModal={closeCreateModal}
          selectedClientId={selectedClientId}
        />
      </Modal>
    </PrivateRoute>
  );
};

export default Page;
