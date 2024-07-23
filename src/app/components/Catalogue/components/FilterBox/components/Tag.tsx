import React from "react";

const Tag = () => {
  return (
    <div className="px-4 text-sm text-white">
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="cart"
        >
          Tag
        </label>
        <div className="flex justify-between items-center gap-2">
          <button
            className={`flex gap-1 items-center justify-center rounded-md  w-1/2 py-1 bg-red-500`}
          >
            Offers
          </button>
          <button
            className={`flex gap-1 items-center justify-center rounded-md  w-1/2 py-1 bg-green-500`}
          >
            Promo
          </button>
          <button
            className={`flex gap-1 items-center justify-center rounded-md  w-1/2 py-1 bg-yellow-500`}
          >
            New
          </button>
          <button
            className={`flex gap-1 items-center justify-center rounded-md  w-1/2 py-1 bg-orange-500`}
          >
            Kits
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tag;
