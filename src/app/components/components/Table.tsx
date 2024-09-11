import React from "react";
import { CiGps, CiMenuKebab } from "react-icons/ci";

const Table = ({ headers, data }: any) => {
  return (
    <div className="h-screen m-5 bg-white flex flex-col text-sm">
      <div className="h-[calc(100vh-10px)] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-table sticky top-0 z-10 w-full">
            <tr>
              {headers.map((header: any, index: any) => (
                <th
                  key={header.key || index}
                  scope="col"
                  className="px-1 py-1 text-xs font-medium text-white uppercase tracking-wider border border-x-white text-center"
                >
                  <div className="flex justify-center items-center">
                    {header.component || header.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 ">
            {data.map((row: any, index: any) => (
              <tr key={row.key || index}>
                {Object.keys(row).map((key, i) => (
                  key !== 'key' && (
                    <td
                      key={i}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200 text-center"
                    >
                      {row[key]}
                    </td>
                  )
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
