"use client";
import React, { useEffect, useRef, useState } from "react";
import { CiMenuKebab } from "react-icons/ci";
import { TbSquares } from "react-icons/tb";
import { GoTag } from "react-icons/go";
import { FaCar, FaHeart } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import InformError from "./ArticeMenuDetails/InformError";
import { useArticleComparation } from "@/app/context/ComparationArticles";
import ArticleEquivalence from "./ArticeMenuDetails/ArticleEquivalences";
import ArticleVehicle from "./ArticeMenuDetails/AritlceVehicles";
import { useTranslation } from "react-i18next";

const ArticleMenu = ({
  article,
  onAddToFavourites,
  isFavourite,
}: {
  onAddToFavourites: () => void;
  isFavourite: boolean;
  article: any;
}) => {
  const { t } = useTranslation();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isInformErrorModalOpen, setInformErrorModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [isEquivalencesModalOpen, setEquivalencesModalOpen] = useState(false);
  const [isArticleVehicleModalOpen, setArticleVehicleModalOpen] =
    useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = (articleId: string) => {
    setActiveMenu(activeMenu === articleId ? null : articleId);
  };
  const { addArticleId } = useArticleComparation();

  const openInformErrorModal = (id: string) => {
    setCurrentArticleId(id);
    setInformErrorModalOpen(true);
    setActiveMenu(null);
  };

  const closeInformErrorModal = () => {
    setInformErrorModalOpen(false);
    setCurrentArticleId(null);
  };

  const openEquivalencesModal = (id: string) => {
    setCurrentArticleId(id);
    setEquivalencesModalOpen(true);
    setActiveMenu(null);
  };

  const closeEquivalencesModal = () => {
    setEquivalencesModalOpen(false);
    setCurrentArticleId(null);
  };

  const openArticleVehicleModal = (id: string) => {
    setCurrentArticleId(id);
    setArticleVehicleModalOpen(true);
    setActiveMenu(null);
  };

  const closeArticleVehicleModal = () => {
    setArticleVehicleModalOpen(false);
    setCurrentArticleId(null);
  };

  return (
    <div className="relative flex items-center gap-1" ref={menuRef}>
      {/* Botón de etiqueta/equivalencias */}
      {article.article_equivalence &&
        article.article_equivalence.length > 0 && (
          <button
            className="
          p-2 rounded-full
          bg-black backdrop-blur
          border border-white/50
          text-white
          hover:bg-[#E10600] hover:border-[#E10600]
          transition-all shadow-lg
        "
            onClick={(e) => {
              e.stopPropagation();
              openEquivalencesModal(article.id);
            }}
            title={t("viewEquivalences")}
          >
            <GoTag className="w-4 h-4" />
          </button>
        )}

      {/* Botón de vehículos */}
      {article.article_vehicles && article.article_vehicles.length > 0 && (
        <button
          className="
          p-2 rounded-full
        bg-black backdrop-blur
          border border-white/50
          text-white
          hover:bg-[#E10600] hover:border-[#E10600]
          transition-all shadow-lg
        "
          onClick={(e) => {
            e.stopPropagation();
            openArticleVehicleModal(article.article_vehicles);
          }}
          title={t("viewArticleApplications")}
        >
          <FaCar className="w-4 h-4" />
        </button>
      )}

      {/* Botón de menú */}
      <button
        className="
        p-2 rounded-full
          bg-black backdrop-blur
          border border-white/50
        text-white
        hover:bg-[#E10600] hover:border-[#E10600]
        transition-all shadow-lg
      "
        onClick={(e) => {
          e.stopPropagation();
          handleToggleMenu();
        }}
        title={t("options")}
      >
        <CiMenuKebab className="w-5 h-5 text-white" />
      </button>

      {/* Dropdown del menú */}
      {isMenuOpen && (
        <div
          className="
        absolute right-0 top-full mt-2
        bg-[#0B0B0B]/95 backdrop-blur
        rounded-2xl shadow-2xl
        border border-white/10
        py-2 z-50 min-w-[190px]
        overflow-hidden
      "
        >
          <button
            className="
            w-full flex items-center
            px-4 py-2.5 text-sm
            text-white/80 hover:text-white
            hover:bg-white/5
            transition-colors
          "
            onClick={(e) => {
              e.stopPropagation();
              onAddToFavourites();
              setIsMenuOpen(false);
            }}
            title={t("addToFavourites")}
          >
            <FaHeart
              className={`w-4 h-4 mr-3 ${
                isFavourite ? "text-[#E10600]" : "text-white/40"
              }`}
            />
            {t("favourites")}
          </button>

          <button
            className="
            w-full flex items-center
            px-4 py-2.5 text-sm
            text-white/80 hover:text-white
            hover:bg-white/5
            transition-colors
          "
            onClick={(e) => {
              e.stopPropagation();
              addArticleId(article);
              setIsMenuOpen(false);
            }}
            title={t("viewDetails")}
          >
            <TbSquares className="w-4 h-4 mr-3 text-white/40" />
            {t("details")}
          </button>

          <div className="my-1 border-t border-white/10" />

          <button
            className="
            w-full flex items-center
            px-4 py-2.5 text-sm
            text-white/80 hover:text-white
            hover:bg-[#E10600]/15
            transition-colors
          "
            onClick={(e) => {
              e.stopPropagation();
              openInformErrorModal(article.id);
              setIsMenuOpen(false);
            }}
          >
            {t("reportError")}
          </button>
        </div>
      )}

      <Modal isOpen={isInformErrorModalOpen} onClose={closeInformErrorModal}>
        {currentArticleId && (
          <InformError
            articleId={currentArticleId}
            closeModal={closeInformErrorModal}
          />
        )}
      </Modal>

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

export default ArticleMenu;
