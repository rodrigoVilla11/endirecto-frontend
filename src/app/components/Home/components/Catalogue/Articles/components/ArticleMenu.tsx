"use client";
import React, { useEffect, useRef, useState } from "react";
import { CiMenuKebab } from "react-icons/ci";
import { TbSquares } from "react-icons/tb";
import { GoTag } from "react-icons/go";
import { FaCar, FaHeart } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import { useArticleComparation } from "@/app/context/ComparationArticles";
import { useTranslation } from "react-i18next";
import ArticleEquivalence from "@/app/components/Catalogue/components/Articles/components/ArticeMenuDetails/ArticleEquivalences";
import ArticleVehicle from "@/app/components/Catalogue/components/Articles/components/ArticeMenuDetails/AritlceVehicles";

const ArticleMenu = ({ article }: { article: any }) => {
  const { t } = useTranslation();
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [isEquivalencesModalOpen, setEquivalencesModalOpen] = useState(false);
  const [isArticleVehicleModalOpen, setArticleVehicleModalOpen] =
    useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const openEquivalencesModal = (id: string) => {
    setCurrentArticleId(id);
    setEquivalencesModalOpen(true);
  };

  const closeEquivalencesModal = () => {
    setEquivalencesModalOpen(false);
    setCurrentArticleId(null);
  };

  const openArticleVehicleModal = () => {
    setArticleVehicleModalOpen(true);
  };

  const closeArticleVehicleModal = () => {
    setArticleVehicleModalOpen(false);
    setCurrentArticleId(null);
  };

  return (
    <div className="relative flex" ref={menuRef}>
      <button
        className="p-1.5 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors z-40"
        onClick={() => {
          openEquivalencesModal(article.id);
        }}
        title={t("viewEquivalences")}
      >
        <GoTag className="w-4 h-4 text-gray-400" />
      </button>

      {article?.article_vehicles && article.article_vehicles.length > 0 && (
        <button
          className="p-1.5 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors z-40"
          onClick={(e) => {
            e.stopPropagation();
            openArticleVehicleModal();
          }}
          title={t("viewArticleApplications")}
        >
          <FaCar className="w-4 h-4 text-gray-400" />
        </button>
      )}

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
        {article?.article_vehicles && article.article_vehicles.length > 0 && (
          <ArticleVehicle
            articleVehicles={article?.article_vehicles}
            closeModal={closeArticleVehicleModal}
          />
        )}
      </Modal>
    </div>
  );
};

export default ArticleMenu;
