"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import {
  useCountBranchQuery,
  useGetBranchPagQuery,
} from "@/redux/services/branchesApi";
import {
  FaAddressBook,
  FaPhone,
  FaWhatsapp,
} from "react-icons/fa";
import { FaLocationPin } from "react-icons/fa6";
import { CiMail } from "react-icons/ci";
import { FaClock } from "react-icons/fa";
import debounce from "@/app/context/debounce";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  // Basic state
  const [page, setPage] = useState(1);
  const [branches, setBranches] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Redux queries
  const { data: countBranchData } = useCountBranchQuery(null);
  const { data, error, isLoading: isQueryLoading, refetch } = useGetBranchPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
  });

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setBranches([]);
    setHasMore(true);
  }, 100);

  // Load branches effect
  useEffect(() => {
    const loadBranches = async () => {
      if (!isLoading) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newBranches = result || [];
          if (page === 1) {
            setBranches(newBranches);
          } else {
            setBranches((prev) => [...prev, ...newBranches]);
          }
          setHasMore(newBranches.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error(t("errorLoadingBranches"), error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadBranches();
  }, [page, searchQuery, refetch, isLoading, t]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
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

  // Reset search handler
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setBranches([]);
    setHasMore(true);
  };

  // Map branch data to table rows
  const tableData = branches?.map((branch) => ({
    key: branch.id,
    id: branch.id,
    name: branch.name,
    address: (
      <div className="relative group">
        <span>
          <FaAddressBook className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.address}
        </div>
      </div>
    ),
    pc: branch.postal_code,
    phone: (
      <div className="relative group">
        <span>
          <FaPhone className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.phone}
        </div>
      </div>
    ),
    whatsapp: (
      <div className="relative group">
        <span>
          <FaWhatsapp className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.whatsapp}
        </div>
      </div>
    ),
    gps: (
      <div className="relative group">
        <span>
          <FaLocationPin className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.gps}
        </div>
      </div>
    ),
    schedules: (
      <div className="relative group">
        <span>
          <FaClock className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.schedule}
        </div>
      </div>
    ),
    "contacts-mails": (
      <div className="relative group">
        <span>
          <CiMail className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.mail_contacts}
        </div>
      </div>
    ),
    "profile-mails": (
      <div className="relative group">
        <span>
          <CiMail className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.mail_profile}
        </div>
      </div>
    ),
  }));

  // Table header configuration
  const tableHeader = [
    { name: t("id"), key: "id", important: true },
    { name: t("name"), key: "name", important: true },
    { name: t("address"), key: "address", important: true },
    { name: t("postalCode"), key: "pc" },
    { name: t("phone"), key: "phone" },
    { name: t("whatsapp"), key: "whatsapp" },
    { name: t("gps"), key: "gps" },
    { name: t("schedules"), key: "schedules" },
    { name: t("contactsMails"), key: "contacts-mails" },
    { name: t("profileMails"), key: "profile-mails" },
  ];

  // Header body: buttons, filters and results
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: searchQuery
      ? t("results", { count: data?.length || 0 })
      : t("results", { count: countBranchData || 0 }),
  };

  if (isQueryLoading && branches.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("errorLoadingBranches")}
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4 bg-white rounded-2xl">
        <h3 className="font-bold p-4">{t("branches")}</h3>
        <Header headerBody={headerBody} />
        {isLoading && branches.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("noBranchesFound")}
          </div>
        ) : (
          <>
            <Table headers={tableHeader} data={tableData} />
            {isLoading && (
              <div ref={loadingRef} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
