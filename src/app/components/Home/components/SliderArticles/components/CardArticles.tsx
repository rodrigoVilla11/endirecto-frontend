"use client";
import React, { useState } from "react";
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
  const { selectedClientId } = useClient();
  const { t } = useTranslation();

  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [isEquivalencesModalOpen, setEquivalencesModalOpen] = useState(false);
  const [isArticleVehicleModalOpen, setArticleVehicleModalOpen] = useState(false);
  const [preventRedirect, setPreventRedirect] = useState(false);

  const openEquivalencesModal = (id: string) => {
    setCurrentArticleId(id);
    setEquivalencesModalOpen(true);
    setPreventRedirect(true);
  };

  const closeEquivalencesModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEquivalencesModalOpen(false);
    setCurrentArticleId(null);
    setTimeout(() => setPreventRedirect(false), 100);
  };

  const openArticleVehicleModal = (id: string) => {
    setCurrentArticleId(id);
    setArticleVehicleModalOpen(true);
    setPreventRedirect(true);
  };

  const closeArticleVehicleModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setArticleVehicleModalOpen(false);
    setCurrentArticleId(null);
    setTimeout(() => setPreventRedirect(false), 100);
  };

  const { setArticleId } = useArticleId();
  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path && !preventRedirect) {
      setArticleId(article.id);
      router.push(path);
    }
  };

  return (
    <div
      onClick={
        isAuthenticated
          ? () => handleRedirect("/catalogue")
          : () => handleRedirect("/catalogues")
      }
      className="
        group relative
        flex flex-col justify-between
        h-[400px] sm:h-[400px]
        w-[170px] sm:w-56
        rounded-3xl m-2
        bg-white/5 backdrop-blur
        border border-white/10
        shadow-xl
        cursor-pointer
        transition-all duration-300
        hover:border-[#E10600]/40 hover:bg-white/10 hover:shadow-2xl
      "
    >
      {/* Top icons */}
      <div className="flex items-center gap-2 p-3">
        <button
          className="
            p-2 rounded-xl
            bg-white/5 border border-white/10
            hover:border-[#E10600]/40 hover:bg-[#E10600]/10
            transition-colors z-40
          "
          onClick={(e) => {
            e.stopPropagation();
            openEquivalencesModal(article.id);
          }}
          title={t("viewEquivalences")}
          aria-label={t("viewEquivalences")}
        >
          <GoTag className="w-4 h-4 text-white/70" />
        </button>

        {article.article_vehicles && article.article_vehicles.length > 0 && (
          <button
            className="
              p-2 rounded-xl
              bg-white/5 border border-white/10
              hover:border-[#E10600]/40 hover:bg-[#E10600]/10
              transition-colors z-40
            "
            onClick={(e) => {
              e.stopPropagation();
              openArticleVehicleModal(article.article_vehicles);
            }}
            title={t("viewArticleApplications")}
            aria-label={t("viewArticleApplications")}
          >
            <FaCar className="w-4 h-4 text-white/70" />
          </button>
        )}
      </div>

      {/* Image */}
      <div className="px-3">
        <ImageArticlesSlider img={article.images ? article.images[0] : ""} />
      </div>

      {/* Stock stripe */}
      {isAuthenticated && <StripeStock articleId={article.id} />}

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Article ID */}
        <p className="text-sm text-white font-extrabold mb-1 tracking-wide">
          {article.id}
        </p>

        {/* Description */}
        <p className="text-xs text-white/70 mb-3 line-clamp-2">
          {article.description}
        </p>

        {/* Prices */}
        {selectedClientId && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <CostPrice articleId={article.id} selectedClientId={selectedClientId} />
            </div>

            <div className="h-px w-full bg-white/10" />

            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <SuggestedPrice articleId={article.id} showPurchasePrice={isAuthenticated} />
            </div>
          </div>
        )}
      </div>

      {/* Acento marca */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E10600] opacity-90 rounded-b-3xl" /> */}

      {/* Modals */}
      <Modal isOpen={isEquivalencesModalOpen} onClose={closeEquivalencesModal}>
        {currentArticleId && (
          <ArticleEquivalence
            articleId={currentArticleId}
            closeModal={closeEquivalencesModal}
          />
        )}
      </Modal>

      <Modal isOpen={isArticleVehicleModalOpen} onClose={closeArticleVehicleModal}>
        <ArticleVehicle
          articleVehicles={article.article_vehicles}
          closeModal={closeArticleVehicleModal}
        />
      </Modal>
    </div>
  );
};

export default CardArticles;
