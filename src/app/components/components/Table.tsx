import React from "react";
import { FaAddressBook } from "react-icons/fa";
import { CiGps, CiMenuKebab } from "react-icons/ci";

const Table = ({ headers }: any) => {
  return (
    <div className="h-screen m-5 bg-white flex flex-col text-sm">
      <div className="h-[calc(100vh-10px)] overflow-y-auto">
        {/* Aquí va el contenido de la tabla */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-table sticky top-0 z-10 w-full">
            <tr>
              {headers.map((item: any, index: any) => {
                return (
                  <th
                    key={index}
                    scope="col"
                    className="px-1 py-1 text-xs font-medium text-white uppercase tracking-wider border border-x-white text-center"
                  >
                    <div className="flex justify-center items-center">
                    {item}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Filas de ejemplo */}
            {[...Array(100).keys()].map((_, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  <div className="rounded-full h-8 w-8 bg-secondary text-white flex justify-center items-center">
                    <p>E</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  00001
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  EVER WEAR S.A
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  <FaAddressBook />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  CTA CTE 15 DIAS 10%DTO 30D 5%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  $0,00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  $0,00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  0,00%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  $0,00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  0
                </td>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  <CiGps className="text-xl text-red-600" />
                </td>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                  <CiMenuKebab className="text-xl text-black" />
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
