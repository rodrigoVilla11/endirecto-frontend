import React from "react";

const TableEquivalences = () => {
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          <th className="py-2 px-4 bg-gray-200 text-left">Brand</th>
          <th className="py-2 px-4 bg-gray-200 text-left">Equivalence Code</th>
        </tr>
      </thead>
      <tbody className="text-xs">
        <tr>
          <td className="border-t py-2 px-4">CASTROL</td>
          <td className="border-t py-2 px-4 max-w-44">ACTEVO 20W50</td>
        </tr>
        <tr>
          <td className="border-t py-2 px-4">GULF</td>
          <td className="border-t py-2 px-4 max-w-44">Pride 4t special</td>
        </tr>
        <tr>
          <td className="border-t py-2 px-4">MOBIL</td>
          <td className="border-t py-2 px-4 max-w-44">SUPER MOTO 20W50</td>
        </tr>
        <tr>
          <td className="border-t py-2 px-4">PETRONAS</td>
          <td className="border-t py-2 px-4 max-w-44">Sprinta F300 20w50</td>
        </tr>
        <tr>
          <td className="border-t py-2 px-4">PUMA</td>
          <td className="border-t py-2 px-4 max-w-44">Urban 20W 50</td>
        </tr>
        <tr>
          <td className="border-t py-2 px-4">SHELL</td>
          <td className="border-t py-2 px-4 max-w-44">20w50 4t Advance Ax3</td>
        </tr>
        <tr>
          <td className="border-t py-2 px-4">VALVOLINE</td>
          <td className="border-t py-2 px-4 max-w-44">4stroke 20w-50</td>
        </tr>
        <tr>
          <td className="border-t py-2 px-4">YPF</td>
          <td className="border-t py-2 px-4 max-w-44">Elaion Moto 4T 20W-50</td>
        </tr>
      </tbody>
    </table>
  );
};

export default TableEquivalences;
