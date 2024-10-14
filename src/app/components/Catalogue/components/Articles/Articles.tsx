import React from "react";
import CardArticles from "./components/CardArticles";
import { useSideMenu } from "@/app/context/SideMenuContext";

const Articles = ({ data }: any) => {
  const { isOpen } = useSideMenu();

  return (
    <div className="h-screen m-4 flex flex-col text-sm">
      <div
        className={`overflow-auto no-scrollbar h-[calc(100vh-10px)] overflow-y-auto grid ${
          isOpen ? "grid-cols-3" : "grid-cols-4"
        } gap-y-10`} 
      >
        {data?.map((article: any, index: number) => (
          <CardArticles key={index} article={article} />
        ))}
      </div>
    </div>
  );
};

export default Articles;
