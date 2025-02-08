"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { AiOutlineDownload } from "react-icons/ai";
import {
  useCountArticlesBonusesQuery,
  useGetArticlesBonusesPagQuery,
} from "@/redux/services/articlesBonusesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetItemsQuery } from "@/redux/services/itemsApi";
import {
  useGetAllArticlesQuery,
} from "@/redux/services/articlesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";
import { FaTimes } from "react-icons/fa";

const ITEMS_PER_PAGE = 20;

const Page = () => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortQuery, setSortQuery] = useState<string>(""); //

  // References
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    error,
    isLoading: isQueryLoading,
    refetch,
  } = useGetArticlesBonusesPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
    sort: sortQuery,
  });
  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setItems([]);
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
            setItems(newBrands);
          } else {
            setItems((prev) => [...prev, ...newBrands]);
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
  }, [page, searchQuery, sortQuery]);

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

  const { data: countArticlesBonusesData } = useCountArticlesBonusesQuery(null);
  const { data: brandsData } = useGetBrandsQuery(null);
  const { data: itemsData } = useGetItemsQuery(null);
  const { data: articlesData } = useGetAllArticlesQuery(null);

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

  // Reset search
  const handleResetSearch = () => {
    setSearchQuery("");
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  const tableData = items?.map((articleBonus) => {
    const brand = brandsData?.find((data) => data.id == articleBonus.brand_id);
    const item = itemsData?.find((data) => data.id == articleBonus.item_id);
    const article = articlesData?.find(
      (data) => data.id == articleBonus.article_id
    );

    return {
      key: articleBonus.id,
      item: item?.name,
      discount: `${articleBonus.percentage_1}%`,
    };
  });

  const tableHeader = [
    { name: "Item", key: "item" },
    { name: "Discount 1", key: "percentage" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
    ],
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
    results: `${countArticlesBonusesData || 0} Results`,
  };

  if (isQueryLoading && items.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading items. Please try again later.
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
        <h3 className="font-bold p-4">BONUSES</h3>
        <Header headerBody={headerBody} />

        {isLoading && items.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No payment conditions found
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
              <div ref={loadingRef} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}{" "}
          </>
        )}
        <div ref={observerRef} className="h-10" />
      </div>
    </PrivateRoute>
  );
};

export default Page;
