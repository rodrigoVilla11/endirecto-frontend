import React from "react";

const TablePrices = () => {
  return (
    <div className="">
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">List Price</p>
        <p className="font-light">$ 6.352,70</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">IVA</p>
        <p className="font-light">21,00%</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">List Price w/IVA</p>
        <p className="font-light">$ 7.686,77</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Bonuses</p>
        <p className="font-light max-w-40">20,00%</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Net Price</p>
        <p className="font-light max-w-40">$ 5.082,16</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between bg-red-400">
        <p className="font-bold">Billing Price</p>
        <p className="font-light max-w-40">$ 5.646,79</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Margin</p>
        <p className="font-light max-w-40">40,00% + 0,00%</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Margin $</p>
        <p className="font-light max-w-40">$ 2.032,86</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Suggested Price</p>
        <p className="font-light max-w-40">$ 7.115,02</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Suggested Price w/IVA</p>
        <p className="font-light max-w-40">$ 8.609,17</p>
      </div>
      <hr />
    </div>
  );
};

export default TablePrices;
