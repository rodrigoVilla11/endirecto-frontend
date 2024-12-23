import React from "react";
import { BsTag } from "react-icons/bs";
import { FaCar } from "react-icons/fa6";
import ImageArticlesSlider from "./ImageArticlesSlider";
import StripeStock from "@/app/components/Catalogue/components/Articles/components/StripeStock";
import { useAuth } from "@/app/context/AuthContext";
import { useArticleId } from "@/app/context/AritlceIdContext";
import { useRouter } from "next/navigation";
import SuggestedPrice from "../../Catalogue/Articles/components/SuggestedPrice";
import CostPrice from "../../Catalogue/Articles/components/CostPrice";
import { useClient } from "@/app/context/ClientContext";

const CardArticles = ({ article }: any) => {
  const { isAuthenticated } = useAuth();
  const encodedId = encodeURIComponent(article.id);
  const { selectedClientId } = useClient();

  const { setArticleId } = useArticleId();

  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) {
      setArticleId(article.id);
      router.push(path);
    }
  };

  return (
    <div
      className="flex flex-col justify-between h-[400px] w-60 shadow-md rounded-lg m-2 border bg-white cursor-pointer"
      onClick={ isAuthenticated ? () => handleRedirect(`/catalogue`) :() => handleRedirect(`/catalogues`)}
    >
      {/* Top Icons */}
      <div className="h-6 flex justify-end items-center gap-2 px-2 text-gray-500">
        <BsTag size={16} />
        <FaCar size={16} />
      </div>

      {/* Image Slider */}
      <div className="flex-grow flex items-center justify-center">
        <ImageArticlesSlider img={article.images ? article.images[0] : ""} />
      </div>

      {/* Stock Stripe */}
      {isAuthenticated && (
        <StripeStock
          articleId={article.id}
          customClass="text-center text-yellow-700 bg-yellow-300 font-semibold text-sm py-1"
        />
      )}

      {/* Content Section */}
      <div className="p-4">
        {/* Article ID */}
        <p className="text-sm text-gray-700 font-bold mb-1">{article.id}</p>

        {/* Description */}
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{article.description}</p>

        {/* Cost Price (if authenticated) */}
        {selectedClientId && <CostPrice articleId={article.id} selectedClientId={selectedClientId} />}

        {/* Divider */}
        {selectedClientId && <hr className="border-gray-300 my-4" />}

        {/* Suggested Price */}
        {selectedClientId && <SuggestedPrice
          articleId={article.id}
          showPurchasePrice={isAuthenticated}
        />}
      </div>
    </div>
  );
};

export default CardArticles;
