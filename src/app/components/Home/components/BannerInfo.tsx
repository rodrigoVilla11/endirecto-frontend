import React from "react";

const BannerInfo = () => {
  return (
    <div className="h-60 w-full bg-secondary flex justify-center items-center gap-10">
      <div className="h-44 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-7xl">2331</p>
        <p className="text-secondary">Customers</p>
      </div>
      <div className="h-44 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-7xl">14</p>
        <p className="text-secondary">Brands</p>
      </div>
      <div className="h-44 w-90 bg-white rounded-lg flex flex-col justify-center items-center">
        <p className="text-7xl">10001</p>
        <p className="text-secondary">Articles</p>
      </div>
    </div>
  );
};

export default BannerInfo;
