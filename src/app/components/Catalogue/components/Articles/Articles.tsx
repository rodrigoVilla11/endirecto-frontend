import React from "react";
import CardArticles from "./components/CardArticles";

const Articles = () => {
  return (
    <div className="h-screen m-4 flex flex-col text-sm">
      <div className="h-[calc(100vh-10px)] overflow-y-auto grid grid-cols-3 gap-10">
       <CardArticles />
       <CardArticles />
       <CardArticles />
       <CardArticles />
       <CardArticles />
       <CardArticles />
      </div>
    </div>
  );
};

export default Articles;
