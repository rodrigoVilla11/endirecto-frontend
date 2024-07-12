import React from "react";
import { BiSearchAlt } from "react-icons/bi";

const Search = () => {
  return (
    <div className="h-10 flex items-center border border-gray-300 rounded-3xl p-2 bg-white shadow-md">
      <div className="relative flex items-center flex-grow">
        <BiSearchAlt className="absolute left-1 text-2xl text-gray-400" />
        <input
          type="text"
          className="h-10 rounded-3xl pl-8 border-none focus:ring-0 outline-none"
          placeholder="Buscá lo que estás necesitando..."
        />
      </div>
    </div>
  );
};

export default Search;
