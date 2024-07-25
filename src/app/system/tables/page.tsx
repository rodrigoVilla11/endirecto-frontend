import Header from '@/app/components/components/Header';
import Input from '@/app/components/components/Input';
import Table from '@/app/components/components/Table';
import React from 'react'
import { FaArrowRightArrowLeft } from "react-icons/fa6";

const page = () => {
    const tableHeader = [
        { name: "Table", key: "table" },
        { name: "Status", key: "status" },
        { name: "Priority", key: "priority" },
        { name: "Date of Update", key: "date-of-update" },
        { name: "Elapsed Minutes", key: "elapsed-minutes" },
        { name: "Active", key: "active" },
        { component: <FaArrowRightArrowLeft className="text-center text-xl" />, key: "pass" },
      ];
      const headerBody = {
        buttons: [
    
        ],
        filters: [
          {
            content: <Input placeholder={"Search..."}/>,
          }
        ],
        results: "20 Results",
      };
    
      return (
        <div className="gap-4">
          <h3 className="text-bold p-4">TABLES</h3>
          <Header headerBody={headerBody} />
          <Table headers={tableHeader} />
        </div>
      );
}

export default page