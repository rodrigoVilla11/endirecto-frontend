"use client";
import React, { useState, useEffect, useRef } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaPencil } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import {
  useCountBrandsQuery,
  useGetBrandsPagQuery,
} from "@/redux/services/brandsApi";
import Modal from "@/app/components/components/Modal";
import UpdateBrandComponent from "./UpdateBrand";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";

const ITEMS_PER_PAGE = 10;

const Page = () => {
  // Basic states
  const [page, setPage] = useState(1);
  const [brands, setBrands] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null);

  // References
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Redux queries
  const { data: countBrandsData } = useCountBrandsQuery(null);
  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetBrandsPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
  });

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setBrands([]);
    setHasMore(true);
  }, 100);

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
          console.error("Error loading brands:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadBrands();
  }, [page, searchQuery]);

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

  // Modal handlers
  const handleModalOpen = (id: string) => {
    const encodedId = encodeURIComponent(id);
    setCurrentBrandId(encodedId);
    setUpdateModalOpen(true);
  };

  const handleModalClose = () => {
    setUpdateModalOpen(false);
    setCurrentBrandId(null);
    refetch();
  };

  // Reset search
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setBrands([]);
    setHasMore(true);
  };

  console.log(brands[0])
  // Table configuration
  const tableData = brands?.map((brand) => ({
    key: brand.id,
    id: brand.id,
    name: brand.name,
    image: (
      <div className="flex justify-center items-center">
        {brand.images ? (
          <img
            src={brand.images}
            alt={brand.name}
            className="h-10 w-auto object-contain"
          />
        ) : (
          <span className="text-gray-400">No image</span>
        )}
      </div>
    ),
    sequence: brand.sequence,
    edit: (
      <div className="flex justify-center items-center">
        <FaPencil
          className="text-center text-lg hover:cursor-pointer hover:text-blue-500"
          onClick={() => handleModalOpen(brand.id)}
        />
      </div>
    ),
  }));

  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    { component: <FaImage className="text-center text-xl" />, key: "image" },
    { name: "Sequence", key: "sequence" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder="Search..."
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
                aria-label="Clear search"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: searchQuery
      ? `${brands.length} Results`
      : `${countBrandsData || 0} Results`,
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
        Error loading brands. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">BRANDS</h3>
        <Header headerBody={headerBody} />

        {isLoading && brands.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No brands found
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

        <Modal isOpen={isUpdateModalOpen} onClose={handleModalClose}>
          {currentBrandId && (
            <UpdateBrandComponent
              brandId={currentBrandId}
              closeModal={handleModalClose}
            />
          )}
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;