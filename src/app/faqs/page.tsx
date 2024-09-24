"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import {
  useCountFaqsQuery,
  useGetFaqsPagQuery,
} from "@/redux/services/faqsApi";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, error, isLoading, refetch } = useGetFaqsPagQuery({
    page,
    limit,
    query: searchQuery,
  });

  const { data: countFaqsData } = useCountFaqsQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = data?.map((faq) => ({
    key: faq._id,
    question: faq.question,
    answer: faq.answer,
  }));
  const tableHeader = [
    { name: "Question", key: "question" },
    { name: "Answer", key: "answer" },
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
      : `${countFaqsData || 0} Results`,
  };
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countFaqsData || 0) / limit)) {
      setPage(page + 1);
    }
  };
  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">FAQS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData} />
      <div className="flex justify-between items-center p-4">
        <button
          onClick={handlePreviousPage}
          disabled={page === 1}
          className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <p>
          Page {page} of {Math.ceil((countFaqsData || 0) / limit)}
        </p>
        <button
          onClick={handleNextPage}
          disabled={page === Math.ceil((countFaqsData || 0) / limit)}
          className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Page;
