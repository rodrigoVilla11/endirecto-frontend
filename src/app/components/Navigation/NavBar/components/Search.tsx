import ArticleSearchResults from "@/app/components/Catalogue/components/Search";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { BiSearchAlt, BiX } from "react-icons/bi";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="h-10 w-full flex items-center border border-gray-200 rounded-full px-4 bg-white shadow-sm">
      <BiSearchAlt className="text-xl text-gray-400 flex-shrink-0" />
      <div className="relative flex items-center flex-1 ml-2">
        <input
          data-ignore-click
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          className="w-full h-full bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-700 placeholder-gray-400"
          placeholder="Busca lo que estás necesitando..."
        />
        {searchQuery && (
          <BiX
            onClick={clearSearch}
            className="text-2xl text-gray-400 cursor-pointer hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
          />
        )}
        <ArticleSearchResults
          query={searchQuery}
          setSearchQuery={setSearchQuery}
          router={router}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
};

export default Search;