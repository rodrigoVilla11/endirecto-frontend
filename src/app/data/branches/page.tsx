"use client";
import React, { useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import {
  useCountBranchQuery,
  useGetBranchesQuery,
  useGetBranchPagQuery,
} from "@/redux/services/branchesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import {
  FaAddressBook,
  FaClock,
  FaMailchimp,
  FaPhone,
  FaWhatsapp,
} from "react-icons/fa";
import { FaLocationPin } from "react-icons/fa6";
import { BsMailbox } from "react-icons/bs";
import { CiMail } from "react-icons/ci";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: countBranchData } = useCountBranchQuery(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const { data, error, isLoading, refetch } = useGetBranchPagQuery({
    page,
    limit,
    query: searchQuery,
  });

  useEffect(() => {
    if (!isFetching) {
      setIsFetching(true);
      refetch()
        .then((result) => {
          const newBrands = result.data || []; // Garantiza que siempre sea un array
          setBranches((prev) => [...prev, ...newBrands]);
        })
        .catch((error) => {
          console.error("Error fetching articles:", error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [page, searchQuery]);

  useEffect(() => {
          setPage(1); // Reinicia la paginación
          setBranches([]); // Limpia los datos anteriores
        }, [searchQuery]);

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
  if (error) return <p>Error</p>;
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
    postal_code: branch.postal_code,
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
    schedule: (
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
    mail_budgets: (
      <div className="relative group">
        <span>
          <CiMail className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.mail_budgets}
        </div>
      </div>
    ),
    mail_collections: (
      <div className="relative group">
        <span>
          <CiMail className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.mail_collections}
        </div>
      </div>
    ),
    mail_collections_summaries: (
      <div className="relative group">
        <span>
          <CiMail className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.mail_collections_summaries}
        </div>
      </div>
    ),
    mail_contacts: (
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
    mail_orders: (
      <div className="relative group">
        <span>
          <CiMail className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.mail_orders}
        </div>
      </div>
    ),
    mail_pendings: (
      <div className="relative group">
        <span>
          <CiMail className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.mail_pendings}
        </div>
      </div>
    ),
    mail_profile: (
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
    mail_system: (
      <div className="relative group">
        <span>
          <CiMail className="text-center text-xl" />
        </span>
        <div className="absolute w-56 left-full top-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded-lg py-1 px-2">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
          {branch.mail_system}
        </div>
      </div>
    ),
  }));
  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    { name: "Address", key: "address" },
    { name: "PC", key: "pc" },
    { name: "Phone", key: "phone" },
    { name: "WhatsApp", key: "whatsapp" },
    { name: "GPS", key: "gps" },
    { name: "Schedules", key: "schedules" },
    { name: "Budget Mails", key: "budget-mails" },
    { name: "Payment Mails", key: "payment-mails" },
    { name: "Payment Summaries Mails", key: "payment-summaries-mails" },
    { name: "Contacts Mails", key: "contacts-mails" },
    { name: "Orders Mails", key: "orders-mails" },
    { name: "Pending Mails", key: "pending-mails" },
    { name: "Profile Mails", key: "profile-mails" },
    { name: "System Mails", key: "system-mails" },
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
      ? `${data?.length || 0} Results`
      : `${countBranchData || 0} Results`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">BRANCHES</h3>
        <Header headerBody={headerBody} />
        <Table headers={tableHeader} data={tableData} />

        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
