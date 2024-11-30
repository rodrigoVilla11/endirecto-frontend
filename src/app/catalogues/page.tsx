import React from "react";
import CataloguePage from "../components/Home/components/Catalogue/CataloguePage";

const Page = () => {
  return (
    <div>
        <div className="overflow-auto no-scrollbar">
          <CataloguePage />
        </div>
    </div>
  );
};

export default Page;
