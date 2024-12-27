import ArticleSearchResults from "@/app/components/Catalogue/components/Search";
import React, { useState } from "react";
import { BiSearchAlt } from "react-icons/bi";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="h-10 flex items-center border border-gray-300 rounded-3xl p-2 bg-white shadow-md">
      <div className="relative flex items-center flex-grow">
        <BiSearchAlt className="absolute left-1 text-2xl text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          className="h-10 rounded-3xl pl-8 border-none focus:ring-0 outline-none"
          placeholder="Buscá lo que estás necesitando..."
        />
        <ArticleSearchResults query={searchQuery} setSearchQuery={setSearchQuery}/>
      </div>
    </div>
  );
};

export default Search;
