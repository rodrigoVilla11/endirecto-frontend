'use client'
import React, { useState } from 'react';
import { FaInfo } from "react-icons/fa";
import { MdAttachMoney } from "react-icons/md";
import { GoTag } from "react-icons/go";
import { GrDocumentText } from "react-icons/gr";
import TableInfo from './TableInfo';
import TablePrices from './TablePrices';
import TableTechnicalDetails from './TableTechnicalDetails';
import TableEquivalences from './TableEquivalences';

const Tables = ({article} : any) => {
  const [activeTable, setActiveTable] = useState('info');

  const renderTable = () => {
    switch (activeTable) {
      case 'info':
        return <TableInfo article={article}/>;
      case 'prices':
        return <TablePrices article={article}/>;
      case 'technical':
        return <TableTechnicalDetails articleId={article.id}/>;
      case 'equivalences':
        return <TableEquivalences articleId={article.id}/>;
      default:
        return <TableInfo />;
    }
  };

  return (
    <div className='w-68 border border-black rounded-sm m-2'>
      <div className='flex h-8 w-full justify-evenly'>
        <button
          className={`w-1/4 flex justify-center items-center rounded-sm ${activeTable === 'info' ? 'bg-gray-300' : ''}`}
          onClick={() => setActiveTable('info')}
        >
          <FaInfo />
        </button>
        <button
          className={`w-1/4 flex justify-center items-center rounded-sm ${activeTable === 'prices' ? 'bg-gray-300' : ''}`}
          onClick={() => setActiveTable('prices')}
        >
          <MdAttachMoney />
        </button>
        <button
          className={`w-1/4 flex justify-center items-center rounded-sm ${activeTable === 'technical' ? 'bg-gray-300' : ''}`}
          onClick={() => setActiveTable('technical')}
        >
          <GrDocumentText />
        </button>
        <button
          className={`w-1/4 flex justify-center items-center rounded-sm ${activeTable === 'equivalences' ? 'bg-gray-300' : ''}`}
          onClick={() => setActiveTable('equivalences')}
        >
          <GoTag />
        </button>
      </div>
      <div className='p-4'>
        {renderTable()}
      </div>
    </div>
  );
}

export default Tables;
