import React from "react";

const TableInfo = () => {
  return (
    <div className="">
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Code</p>
        <p className="font-light">E MOT4R/1</p>
      </div>
      <hr />
      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Supplier Code</p>
        <p className="font-light">218282</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Brand</p>
        <p className="font-light">ELF MOTO</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Item</p>
        <p className="font-light max-w-40">LUBRICANTES MOTOS ENVASADO</p>
      </div>
      <hr />

      <div className="hover:bg-gray-300 p-1 rounded-sm flex justify-between">
        <p className="font-bold">Description</p>
        <p className="font-light max-w-40">ELF MOTO 4 CRUISE 20W50 X 1L</p>
      </div>
      <hr />
    </div>
  );
};

export default TableInfo;
