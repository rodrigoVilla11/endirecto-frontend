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

const ArticleMenu = ({
  article,
  onAddToFavourites,
  isFavourite,
}: {
  onAddToFavourites: () => void;
  isFavourite: boolean;
  article: any;
}) => {
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
      // 3. Verificamos que menuRef.current exista y forzamos el tipo de event.target a Node.
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
    setActiveMenu(null); // Cierra el menú al abrir el modal
  };

  const closeInformErrorModal = () => {
    setInformErrorModalOpen(false);
    setCurrentArticleId(null);
  };

  const openEquivalencesModal = (id: string) => {
    setCurrentArticleId(id);
    setEquivalencesModalOpen(true);
    setActiveMenu(null); // Cierra el menú al abrir el modal
  };

  const closeEquivalencesModal = () => {
    setEquivalencesModalOpen(false);
    setCurrentArticleId(null);
  };

  const openArticleVehicleModal = (id: string) => {
    setCurrentArticleId(id);
    setArticleVehicleModalOpen(true);
    setActiveMenu(null); // Cierra el menú al abrir el modal
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
        title="Ver equivalencias"
      >
        <GoTag className="w-4 h-4 text-gray-400" />
      </button>

      {article.article_vehicles && article.article_vehicles.length > 0 && (
        <button
          className="p-1.5 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors z-40"
          onClick={() => {
            openArticleVehicleModal(article.article_vehicles);
          }}
          title="Ver aplicaciones por articulo"
        >
          <FaCar className="w-4 h-4 text-gray-400" />
        </button>
      )}

      <button
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        onClick={handleToggleMenu}
        title="Opciones"
      >
        <CiMenuKebab className="w-5 h-5 text-gray-400" />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          <button
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => {
              onAddToFavourites();
              setIsMenuOpen(false);
            }}
            title="Añadir a favoritos"
          >
            <FaHeart
              className={`w-4 h-4 mr-2 ${
                isFavourite ? "text-red-500" : "text-gray-400"
              }`}
            />
            Favoritos
          </button>

          <button
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => {
              addArticleId(article);
              setIsMenuOpen(false);
            }}
            title="Ver detalles"
          >
            <TbSquares className="w-4 h-4 mr-2 text-gray-400" />
            Detalles
          </button>

          <button
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => {
              openInformErrorModal(article.id);
              setIsMenuOpen(false);
            }}
          >
            Informar Error
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
