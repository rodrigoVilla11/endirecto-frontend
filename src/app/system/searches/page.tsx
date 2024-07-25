import Header from '@/app/components/components/Header';
import Input from '@/app/components/components/Input';
import Table from '@/app/components/components/Table';
import React from 'react'
import { FaTrashCan } from 'react-icons/fa6';

const page = () => {
    const tableHeader = [
        { name: "Searched Text", key: "searched-text" },
        { name: "Searches with no result", key: "searches-with-no-result" },
        { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
      ];
      const headerBody = {
        buttons: [],
        filters: [
          {
            content: <Input placeholder={"Search..."}/>,
          }
        ],
        results: "30 Results",
      };
    
      return (
        <div className="gap-4">
          <h3 className="text-bold p-4">SEARCHES WITH NO RESULT</h3>
          <Header headerBody={headerBody} />
          <Table headers={tableHeader} />
        </div>
      );
}

export default page