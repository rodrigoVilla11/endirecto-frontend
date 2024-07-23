"use client";
import React, { useState } from "react";
import FilterBox from "./components/FilterBox/FilterBox";
import { FaFilter, FaList } from "react-icons/fa";
import { RxDashboard } from "react-icons/rx";

const CataloguePage = () => {
  const [isFilterBoxVisible, setFilterBoxVisible] = useState(true);
  const [showArticles, setShowArticles] = useState("catalogue");

  const toggleFilterBox = () => {
    setFilterBoxVisible((prevState) => !prevState);
  };

  const toggleShowArticles = (type) => {
    setShowArticles(type);
  };

  return (
    <div className="gap-4">
      <h3 className="text-bold p-4">CATALOGUE</h3>
      <div className="flex gap-2">
        <FilterBox
          isVisible={isFilterBoxVisible}
          onClose={() => setFilterBoxVisible(false)}
        />
        <div className="flex justify-between w-full">
          <div className="flex justify-center gap-2 px-2">
        <button
          onClick={toggleFilterBox}
          className={`p-2 flex items-center justify-center text-sm gap-2 h-8 ${
            isFilterBoxVisible
              ? "bg-primary text-white"
              : "bg-white text-primary border border-primary"
          } text-white rounded`}
        >
          <FaFilter className={`${isFilterBoxVisible ? "text-white" : "text-primary"}`} />
          Filters
        </button>
        <button
          onClick={() => toggleShowArticles("catalogue")}
          className={`p-2 flex items-center justify-center text-sm gap-2 h-8 ${
            showArticles === "catalogue"
              ? "bg-primary text-white"
              : "bg-white text-primary border border-primary"
          } text-white rounded`}
        >
          <RxDashboard className={`${showArticles === "catalogue" ? "text-white" : "text-primary"}`} />
        </button>
        <button
          onClick={() => toggleShowArticles("list")}
          className={`p-2 flex items-center justify-center text-sm gap-2 h-8 ${
            showArticles === "list"
              ? "bg-primary text-white"
              : "bg-white text-primary border border-primary"
          } text-white rounded`}
        >
          <FaList className={`${showArticles === "list" ? "text-white" : "text-primary"}`} />
        </button>
        </div>
        <p className="text-xs pr-4">8.289 Results</p>
      </div>
      </div>
    </div>
  );
};

export default CataloguePage;

