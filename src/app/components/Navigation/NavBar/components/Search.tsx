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
    <div className="h-8 w-[80%] sm:w-[100%] flex items-center border border-gray-300 rounded-3xl p-2 bg-white shadow-md">
      <div className="relative flex items-center flex-grow">
        <BiSearchAlt className="absolute left-1 text-2xl text-gray-400" />
        <input
          data-ignore-click
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          className="h-6 rounded-3xl pl-8 border-none focus:ring-0 outline-none text-xs font-semibold"
          placeholder="Buscá lo que estás necesitando..."
        />
        {searchQuery && (
          <BiX
            onClick={clearSearch}
            className="absolute right-1 text-2xl text-gray-400 cursor-pointer"
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
