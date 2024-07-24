import React from 'react';

const TableTechnicalDetails = () => {
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          <th className="py-2 px-4 bg-gray-200 text-left max-w-36">Technical Characteristics</th>
          <th className="py-2 px-4 bg-gray-200 text-left">Value</th>
        </tr>
      </thead>
      <tbody className="text-xs"> 
        <tr>
          <td className="border-t py-2 px-4">Type</td>
          <td className="border-t py-2 px-4 max-w-28">Mineral</td>
        </tr>
        <tr>
          <td className="border-t py-2 px-4">Viscosity</td>
          <td className="border-t py-2 px-4 max-w-28">SAE 20w50</td>
        </tr>
        <tr>
          <td className="border-t py-2 px-4">Rule</td>
          <td className="border-t py-2 px-4 max-w-28">API SL // JASO MA2</td>
        </tr>
        <tr>
          <td className="border-t py-2 px-4">Use</td>
          <td className="border-t py-2 px-4 max-w-28">Motores 4T</td>
        </tr>
      </tbody>
    </table>
  );
};

export default TableTechnicalDetails;
