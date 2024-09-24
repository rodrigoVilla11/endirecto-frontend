import Header from '@/app/components/components/Header';
import Input from '@/app/components/components/Input';
import Table from '@/app/components/components/Table';
import React from 'react'
import { FaArrowRightArrowLeft, FaPencil } from 'react-icons/fa6';

const Page = () => {
    const tableHeader = [
        { name: "Name", key: "name" },
        { name: "Schedules", key: "schedules" },
        { name: "Interval", key: "interval" },
        { name: "Active", key: "active" },
        { name: "Last Execution", key: "last-execution" },
        { name: "Last Execution End", key: "last-execution-end" },
        { component: <FaPencil className="text-center text-xl" />, key: "edit" },
        { component: <FaArrowRightArrowLeft className="text-center text-xl" />, key: "pass" },
      ];
      const headerBody = {
        buttons: [        ],
        filters: [
          {
            content: <Input placeholder={"Search..."}/>,
          }
        ],
        results: "20 Results",
      };
    
      return (
        <div className="gap-4">
          <h3 className="text-bold p-4">SCHEDULED TASKS</h3>
          <Header headerBody={headerBody} />
          {/* <Table headers={tableHeader} /> */}
        </div>
      );
}

export default Page