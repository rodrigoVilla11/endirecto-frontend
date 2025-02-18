"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { AiOutlineDownload } from "react-icons/ai";
import { FaPlus, FaTimes } from "react-icons/fa";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import DatePicker from "react-datepicker";
import PrivateRoute from "../context/PrivateRoutes";
import CreateReclaimComponent from "./CreateReclaim";
import DeleteReclaim from "./DeleteReclaim";
import UpdateReclaimComponent from "./UpdateReclaim";
import { useGetReclaimsPagQuery, useCountReclaimsQuery, Status } from "@/redux/services/reclaimsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetUsersQuery } from "@/redux/services/usersApi";
import { useClient } from "../context/ClientContext";
import debounce from "../context/debounce";
import { useTranslation } from "react-i18next";
import Modal from "../components/components/Modal";

const ITEMS_PER_PAGE = 20;

const pageReclaims = () => {
  const { t } = useTranslation();
  // Basic states
  const [page, setPage] = useState(1);
  const [brands, setBrands] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); // Formato: "campo:asc" o "campo:desc"
  const [customer_id, setCustomer_id] = useState("");
  const { selectedClientId } = useClient();

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentReclaimId, setCurrentReclaimId] = useState<string | null>(null);
  // References
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const [searchParams, setSearchParams] = useState({
    status: "",
    valid: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    document_type_number: "",
  });

  const { data: branchData } = useGetBranchesQuery(null);
  const { data: customerData } = useGetCustomersQuery(null);
  const { data: userDatas } = useGetUsersQuery(null);
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetReclaimsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    startDate: searchParams.startDate ? searchParams.startDate.toISOString() : undefined,
    endDate: searchParams.endDate ? searchParams.endDate.toISOString() : undefined,
    valid: searchParams.valid,
    status: searchParams.status,
    document_type_number: searchParams.document_type_number,
    customer_id: customer_id,
    sort: sortQuery,
  });
  const { data: countReclaimsData } = useCountReclaimsQuery(null);

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setBrands([]);
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
    const loadBrands = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newBrands = result || [];
          if (page === 1) {
            setBrands(newBrands);
          } else {
            setBrands((prev) => [...prev, ...newBrands]);
          }
          setHasMore(newBrands.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error(t("pageReclaims.errorLoadingBrands"), error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadBrands();
  }, [page, searchQuery, sortQuery, searchParams]);

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

  const handleSort = useCallback(
    (field: string) => {
      const [currentField, currentDirection] = sortQuery.split(":");
      let newSortQuery = "";
      if (currentField === field) {
        // Alternar entre ascendente y descendente
        newSortQuery = currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
        // Nuevo campo de ordenamiento, por defecto ascendente
        newSortQuery = `${field}:asc`;
      }
      setSortQuery(newSortQuery);
      setPage(1);
      setBrands([]);
      setHasMore(true);
    },
    [sortQuery]
  );

  // Reset search
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setBrands([]);
    setHasMore(true);
  };

  const tableData = brands?.map((reclaim) => {
    const branch = branchData?.find((d) => d.id == reclaim.branch_id);
    const customer = customerData?.find((d) => d.id == reclaim.customer_id);
    const user = userDatas?.find((d) => d._id == reclaim.user_id);
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
        <div className="flex justify-center items-center">
          <FaPencil
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openUpdateModal(reclaim._id)}
          />
        </div>
      ),
      erase: (
        <div className="flex justify-center items-center">
          <FaTrashCan
            className="text-center text-lg hover:cursor-pointer"
            onClick={() => openDeleteModal(reclaim._id)}
          />
        </div>
      ),
    };
  });
  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: t("pageReclaims.table.number"), key: "number", important: true },
    { name: t("pageReclaims.table.status"), key: "status", important: true },
    { name: t("pageReclaims.table.type"), key: "type", important: true },
    { name: t("pageReclaims.table.description"), key: "description" },
    { name: t("pageReclaims.table.customer"), key: "customer", important: true },
    { name: t("pageReclaims.table.user"), key: "user" },
    { name: t("pageReclaims.table.branch"), key: "branch" },
    { name: t("pageReclaims.table.date"), key: "date" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];
  const headerBody = {
    buttons: [
      ...(selectedClientId
        ? [
            {
              logo: <FaPlus />,
              title: t("pageReclaims.header.new"),
              onClick: openCreateModal,
            },
          ]
        : []),
      {
        logo: <AiOutlineDownload />,
        title: t("pageReclaims.header.download"),
      },
    ],
    filters: [
      {
        content: (
          <DatePicker
            selected={searchParams.startDate}
            onChange={(date) =>
              setSearchParams({ ...searchParams, startDate: date })
            }
            placeholderText={t("pageReclaims.header.dateFrom")}
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
            placeholderText={t("pageReclaims.header.dateTo")}
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
            <option value="">{t("pageReclaims.header.statusPlaceholder")}</option>
            {Object.values(Status).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        ),
      },
      {
        content: (
          <div className="relative">
            <Input
              placeholder={t("pageReclaims.header.searchPlaceholder")}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                debouncedSearch(e.target.value)
              }
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleResetSearch}
                aria-label={t("pageReclaims.header.clearSearch")}
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
      {
        content: (
          <Input
            placeholder={t("pageReclaims.header.numberPlaceholder")}
            value={searchParams.document_type_number}
            onChange={(e: any) =>
              setSearchParams((prev) => ({
                ...prev,
                document_type_number: e.target.value,
              }))
            }
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: t("pageReclaims.header.results", { count: countReclaimsData || 0 }),
  };
  if (isQueryLoading && brands.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("pageReclaims.errorLoadingBrands")}
      </div>
    );
  }
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
        <h3 className="font-bold p-4">{t("pageReclaims.title")}</h3>
        <Header headerBody={headerBody} />
        {isLoading && brands.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t("pageReclaims.noReclaimsFound")}</div>
        ) : (
          <>
            <Table
              headers={tableHeader}
              data={tableData}
              onSort={handleSort}
              sortField={sortQuery.split(":")[0]}
              sortOrder={sortQuery.split(":")[1] as "asc" | "desc" | ""}
            />
            {isLoading && (
              <div ref={loadingRef} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}
        <div ref={observerRef} className="h-10" />
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
      </div>
    </PrivateRoute>
  );
};

export default pageReclaims;
