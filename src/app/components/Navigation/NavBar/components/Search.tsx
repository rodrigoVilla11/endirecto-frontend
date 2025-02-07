import ArticleSearchResults from "@/app/components/Catalogue/components/Search";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { BiSearchAlt } from "react-icons/bi";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="h-10 w-[90%] flex items-center border border-gray-300 rounded-3xl p-2 bg-white shadow-md">
      <div className="relative flex items-center flex-grow">
        <BiSearchAlt className="absolute left-1 text-2xl text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          className="h-10 rounded-3xl pl-8 border-none focus:ring-0 outline-none text-xs font-semibold"
          placeholder="Buscá lo que estás necesitando..."
        />
        <ArticleSearchResults
          query={searchQuery}
          setSearchQuery={setSearchQuery}
          router={router}
        />
      </div>
    </div>
  );
};

export default Search;
