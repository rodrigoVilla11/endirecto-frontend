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
import {
  useGetReclaimsPagQuery,
  useCountReclaimsQuery,
  Status,
} from "@/redux/services/reclaimsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetUsersQuery } from "@/redux/services/usersApi";
import { useClient } from "../context/ClientContext";
import debounce from "../context/debounce";
import { useTranslation } from "react-i18next";
import Modal from "../components/components/Modal";
import { useAuth } from "../context/AuthContext";
import { IoMdClose } from "react-icons/io";

const ITEMS_PER_PAGE = 20;


const PageReclaims = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const { userData } = useAuth();

  const [page, setPage] = useState(1);
  const [brands, setBrands] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>("date:desc");
  const [customer_id, setCustomer_id] = useState("");

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentReclaimId, setCurrentReclaimId] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const openDetailModal = (data: any) => {
    setDetailData(data);
    setDetailOpen(true);
  };

  const closeDetailModal = () => {
    setDetailOpen(false);
    setDetailData(null);
  };
  const translateStatus = (status?: string) => {
    if (!status) return "-";
    return t(`updateReclaimComponent.statusLabels.${status}`) || status;
  };
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
    startDate: searchParams.startDate
      ? searchParams.startDate.toISOString()
      : undefined,
    endDate: searchParams.endDate
      ? searchParams.endDate.toISOString()
      : undefined,
    valid: searchParams.valid,
    status: searchParams.status,
    document_type_number: searchParams.document_type_number,
    customer_id: customer_id,
    sort: sortQuery,
  });
  const { data: countReclaimsData } = useCountReclaimsQuery(null);

  // 🔐 Rol
  const userRole = (userData?.role || "").toUpperCase();
  const isAdmin = userRole === "ADMINISTRADOR";

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
      refetch();
    } else {
      setCustomer_id("");
      refetch();
    }
  }, [selectedClientId, refetch]);

  useEffect(() => {
    if (data) {
      setBrands((prev) => {
        if (page === 1) {
          return data;
        }
        const newArticles = data.filter(
          (article) => !prev.some((item) => item.id === article._id)
        );
        return [...prev, ...newArticles];
      });
      setHasMore(data.length === ITEMS_PER_PAGE);
    }
  }, [data, page]);

  // ======================================================
  // Infinite Scroll (Intersection Observer)
  // ======================================================
  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isQueryLoading) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.0, rootMargin: "200px" }
      );

      if (node) observerRef.current.observe(node);
    },
    [hasMore, isQueryLoading]
  );

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const openUpdateModal = (id: string) => {
    if (!isAdmin) return; // 🔒 solo ADMIN
    setCurrentReclaimId(id);
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setCurrentReclaimId(null);
    refetch();
  };

  const openDeleteModal = (id: string) => {
    if (!isAdmin) return; // 🔒 solo ADMIN
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
        newSortQuery =
          currentDirection === "asc" ? `${field}:desc` : `${field}:asc`;
      } else {
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

  const tableData =
    brands?.map((reclaim) => {
      const customer = customerData?.find((d) => d.id == reclaim.customer_id);

      return {
        key: reclaim._id,
        info: (
          <button
            onClick={() => openDetailModal(reclaim)}
            className="text-gray-600 hover:text-blue-800"
          >
            <IoInformationCircleOutline className="text-center text-xl" />
          </button>
        ),

        id: reclaim._id,
        status: translateStatus(reclaim.status),
        type: reclaim.reclaims_type_id,
        description: reclaim.description,
        customer: customer?.name,
        date: reclaim.date,
        ...(isAdmin && {
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
        }),
      };
    }) || [];

  const baseHeaders = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: t("pageReclaims.table.status"), key: "status", important: true },
    { name: t("pageReclaims.table.type"), key: "type", important: true },
    { name: t("pageReclaims.table.description"), key: "description" },
    {
      name: t("pageReclaims.table.customer"),
      key: "customer",
      important: true,
    },
    { name: t("pageReclaims.table.date"), key: "date" },
  ];

  const adminHeaders = [
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  const tableHeader = isAdmin ? [...baseHeaders, ...adminHeaders] : baseHeaders;

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
            className="w-full max-w-sm border border-gray-300 rounded-md p-2 md:p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">
              {t("pageReclaims.header.statusPlaceholder")}
            </option>
            {Object.values(Status).map((st) => (
              <option key={st} value={st}>
                {translateStatus(st)}
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
    results: t("pageReclaims.header.results", {
      count: countReclaimsData || 0,
    }),
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
        <h3 className="font-bold p-4 text-white">{t("pageReclaims.title")}</h3>
        <Header headerBody={headerBody} />
        {isLoading && brands.length === 0 ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("pageReclaims.noReclaimsFound")}
          </div>
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
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}
        <div ref={lastArticleRef} className="h-10" />
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
        <Modal isOpen={detailOpen} onClose={closeDetailModal}>
          {detailData && (
            <ReclaimDetail data={detailData} onClose={closeDetailModal} />
          )}
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default PageReclaims;

interface ReclaimDetailProps {
  data: any;
  onClose: () => void;
}

const ReclaimDetail: React.FC<ReclaimDetailProps> = ({ data, onClose }) => {
  const { t } = useTranslation();

  const translateStatus = (status?: string) => {
    if (!status) return "-";
    return t(`updateReclaimComponent.statusLabels.${status}`) || status;
  };

  const fmt = (v: any) => (v ? v : "—");

  return (
    <div className="bg-white rounded-xl shadow-xl max-w-2xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <h2 className="text-lg font-bold text-gray-700">
          {t("crmd.type.reclaim")} #{data._id}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-200"
        >
          <IoMdClose size={20} />
        </button>
      </div>

      {/* BODY SCROLLABLE */}
      <div className="p-6 overflow-y-auto">
        {/* MAIN INFORMATION */}
        <h3 className="text-md font-semibold mb-2 text-gray-700">
          {t("updateReclaimComponent.mainInfo")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">
              {t("updateReclaimComponent.reclaimType")}
            </p>
            <p className="font-medium">{fmt(data.reclaims_type_id)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {t("updateReclaimComponent.customer")}
            </p>
            <p className="font-medium">
              {fmt(data.customer_name || data.customer_id)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              {t("updateReclaimComponent.branch")}
            </p>
            <p className="font-medium">
              {fmt(data.branch_name || data.branch_id)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              {t("updateReclaimComponent.date")}
            </p>
            <p className="font-medium">{data.date}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              {t("updateReclaimComponent.status")}
            </p>
            <span className="inline-block mt-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              {translateStatus(data.status)}
            </span>
          </div>
        </div>

        {/* DESCRIPTION SECTION */}
        <h3 className="text-md font-semibold mb-2 text-gray-700">
          {t("updateReclaimComponent.descriptionSection")}
        </h3>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {fmt(data.description)}
          </p>
        </div>

        {/* RESOLUTION SECTION */}
        <h3 className="text-md font-semibold mb-2 text-gray-700">
          {t("updateReclaimComponent.resolutionSection")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">
              {t("updateReclaimComponent.cause")}
            </p>
            <p className="font-medium">{fmt(data.cause)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              {t("updateReclaimComponent.solution")}
            </p>
            <p className="font-medium">{fmt(data.solution)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              {t("updateReclaimComponent.internalSolution")}
            </p>
            <p className="font-medium text-gray-700">
              {fmt(data.internal_solution)}
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t flex justify-end bg-gray-50">
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
        >
          {t("updateReclaimComponent.close")}
        </button>
      </div>
    </div>
  );
};
