import React, { useState } from "react";
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
import { GoTag } from "react-icons/go";
import { useTranslation } from "react-i18next";
import Modal from "@/app/components/components/Modal";
import ArticleEquivalence from "@/app/components/Catalogue/components/Articles/components/ArticeMenuDetails/ArticleEquivalences";
import ArticleVehicle from "@/app/components/Catalogue/components/Articles/components/ArticeMenuDetails/AritlceVehicles";

const CardArticles = ({ article }: any) => {
  const { isAuthenticated } = useAuth();
  const encodedId = encodeURIComponent(article.id);
  const { selectedClientId } = useClient();
  const { t } = useTranslation();
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [isEquivalencesModalOpen, setEquivalencesModalOpen] = useState(false);
  const [isArticleVehicleModalOpen, setArticleVehicleModalOpen] =
    useState(false);

  const openEquivalencesModal = (id: string) => {
    setCurrentArticleId(id);
    setEquivalencesModalOpen(true);
  };

  const closeEquivalencesModal = () => {
    setEquivalencesModalOpen(false);
    setCurrentArticleId(null);
  };

  const openArticleVehicleModal = (id: string) => {
    setCurrentArticleId(id);
    setArticleVehicleModalOpen(true);
  };

  const closeArticleVehicleModal = () => {
    setArticleVehicleModalOpen(false);
    setCurrentArticleId(null);
  };
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
      className="flex flex-col justify-between h-[400px] w-44 sm:w-56 shadow-md rounded-lg m-2 border bg-white cursor-pointer"
      onClick={
        isAuthenticated
          ? () => handleRedirect(`/catalogue`)
          : () => handleRedirect(`/catalogues`)
      }
    >
      {/* Top Icons */}
      <div className="flex items-center space-x-4">
        <button
          className="p-1.5 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors z-40"
          onClick={(e) => {
            e.stopPropagation();
            openEquivalencesModal(article.id);
          }}
          title={t("viewEquivalences")}
        >
          <GoTag className="w-4 h-4 text-gray-400" />
        </button>

        {article.article_vehicles && article.article_vehicles.length > 0 && (
          <button
            className="p-1.5 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors z-40"
            onClick={(e) => {
              e.stopPropagation();
              openArticleVehicleModal(article.article_vehicles);
            }}
            title={t("viewArticleApplications")}
          >
            <FaCar className="w-4 h-4 text-gray-400" />
          </button>
        )}
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
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {article.description}
        </p>

        {/* Cost Price (if authenticated) */}
        {selectedClientId && (
          <CostPrice
            articleId={article.id}
            selectedClientId={selectedClientId}
          />
        )}

        {/* Divider */}
        {selectedClientId && <hr className="border-gray-300 my-4" />}

        {/* Suggested Price */}
        {selectedClientId && (
          <SuggestedPrice
            articleId={article.id}
            showPurchasePrice={isAuthenticated}
          />
        )}
      </div>
      <Modal isOpen={isEquivalencesModalOpen} onClose={closeEquivalencesModal}>
        {currentArticleId && (
          <ArticleEquivalence
            articleId={currentArticleId}
            closeModal={closeEquivalencesModal}
          />
        )}
      </Modal>
      <Modal
        isOpen={isArticleVehicleModalOpen}
        onClose={closeArticleVehicleModal}
      >
        <ArticleVehicle
          articleVehicles={article.article_vehicles}
          closeModal={closeArticleVehicleModal}
        />
      </Modal>
    </div>
  );
};

export default CardArticles;
