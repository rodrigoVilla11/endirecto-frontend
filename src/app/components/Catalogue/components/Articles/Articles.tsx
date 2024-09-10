import React from "react";
import CardArticles from "./components/CardArticles";
import { useSideMenu } from "@/app/context/SideMenuContext";

const Articles = ({ data }: any) => {
  const { isOpen } = useSideMenu();

  return (
    <div className="h-screen m-4 flex flex-col text-sm">
      <div
        className={`h-[calc(100vh-10px)] overflow-y-auto grid ${
          isOpen ? "grid-cols-2" : "grid-cols-3"
        } gap-2`}
      >
        {data?.map((article: any, index: number) => (
          <CardArticles key={index} article={article} />
        ))}
      </div>
    </div>
  );
};

export default Articles;
