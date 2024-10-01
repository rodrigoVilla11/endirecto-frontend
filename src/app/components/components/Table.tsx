import React from "react";

const Table = ({ headers, data }: any) => {
  return (
    <div className="h-full m-5 bg-white flex flex-col text-xs overflow-x-hidden">
      <div className="h-full overflow-y-auto overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-table sticky top-0 z-10">
            <tr>
              {headers.map((header: any, index: any) => (
                <th
                  key={header.key || index}
                  scope="col"
                  className="px-2 py-2 text-xs font-medium text-white uppercase tracking-wider border border-x-white text-center"
                >
                  <div className="flex justify-center items-center">
                    {header.component || header.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-center">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No se encontraron datos
                </td>
              </tr>
            ) : (
              data.map((row: any, index: any) => (
                <tr key={row.key || index}>
                  {Object.keys(row).map((key, i) =>
                    key !== "key" ? (
                      <td
                        key={i}
                        className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border border-gray-200 text-center "
                      >
                        {row[key]}
                      </td>
                    ) : null
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
