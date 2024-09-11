"use client"
import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetFaqsQuery } from "@/redux/services/faqsApi";

const page = () => {
  const { data, error, isLoading, refetch } = useGetFaqsQuery(null);

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
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">FAQS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
    </div>
  );
};

export default page;
