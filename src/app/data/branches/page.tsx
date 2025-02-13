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
import debounce from "@/app/context/debounce";

const ITEMS_PER_PAGE = 15;

const Page = () => {
 // Estados básicos
   const [page, setPage] = useState(1);
   const [branches, setBranches] = useState<any[]>([]);
   const [hasMore, setHasMore] = useState(true);
   const [isLoading, setIsLoading] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");

 // Referencias
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);


   // Queries de Redux (mantenidas como estaban)
    const { data: countBranchData } = useCountBranchQuery(null);
    const {
      data,
      error,
      isLoading: isQueryLoading,
      refetch,
    } = useGetBranchPagQuery({
      page,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
    });
  
  // Búsqueda con debounce
   const debouncedSearch = debounce((query: string) => {
     setSearchQuery(query);
     setPage(1);
     setBranches([]);
     setHasMore(true);
   }, 100);
 
   // Efecto para manejar la carga inicial y las búsquedas
   useEffect(() => {
     const loadBranches = async () => {
       if (!isLoading) {
         setIsLoading(true);
         try {
           const result = await refetch().unwrap();
           const newBranchs = result || [];
 
           if (page === 1) {
            setBranches(newBranchs);
           } else {
            setBranches((prev) => [...prev, ...newBranchs]);
           }
 
           setHasMore(newBranchs.length === ITEMS_PER_PAGE);
         } catch (error) {
           console.error("Error loading branches:", error);
         } finally {
           setIsLoading(false);
         }
       }
     };
 
     loadBranches();
   }, [page, searchQuery]);
 

  // Intersection Observer para scroll infinito
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
  
    // Reset de búsqueda
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setBranches([]);
    setHasMore(true);
  };

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
  
  }));
  const tableHeader = [
    { name: "Id", key: "id",  important:true },
    { name: "Name", key: "name", important:true },
    { name: "Address", key: "address" , important:true},
    { name: "PC", key: "pc" },
    { name: "Phone", key: "phone" },
    { name: "WhatsApp", key: "whatsapp" },
    { name: "GPS", key: "gps" },
    { name: "Schedules", key: "schedules" },
    { name: "Contacts Mails", key: "contacts-mails" },
    { name: "Profile Mails", key: "profile-mails" },
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
        Error loading branches. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">BRANCHES</h3>
        <Header headerBody={headerBody} />
        
        {isLoading && branches.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No branches found
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
