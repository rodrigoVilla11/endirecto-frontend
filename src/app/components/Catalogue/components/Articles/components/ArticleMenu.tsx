"use client"
import React, { useState } from 'react';
import { CiMenuKebab } from "react-icons/ci";
import { TbSquares } from "react-icons/tb";
import { GoTag } from "react-icons/go";
import { FaHeart } from 'react-icons/fa';
import Modal from '@/app/components/components/Modal';
import InformError from './ArticeMenuDetails/InformError';
import { useArticleComparation } from '@/app/context/ComparationArticles';
import ArticleEquivalence from './ArticeMenuDetails/ArticleEquivalences';

const ArticleMenu = ({ article, onAddToFavourites, isFavourite }: { onAddToFavourites: () => void, isFavourite: boolean, article: any }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isInformErrorModalOpen, setInformErrorModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [isEquivalencesModalOpen, setEquivalencesModalOpen] = useState(false);

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
  

  return (
    <div className="flex justify-end items-center px-4 py-2">
      <div className="flex items-center space-x-4">
        <button className="flex items-center justify-center" onClick={onAddToFavourites}>
          <FaHeart className={`transition-colors duration-300 ${isFavourite ? 'text-red-500' : 'text-gray-600'} cursor-pointer text-xl`} />
        </button>
        <button className="flex items-center justify-center">
          <TbSquares className='text-gray-500 cursor-pointer text-xl' onClick={() => addArticleId(article)} />
        </button>
        <button className="flex items-center justify-center">
          <GoTag className='text-gray-500 cursor-pointer text-xl' onClick={() => openEquivalencesModal(article.id)}/>
        </button>
        <button className="flex items-center justify-center">
          <div className="relative">
            <CiMenuKebab
              className="text-center text-xl cursor-pointer"
              onClick={() => toggleMenu(article.id)}
            />
            {activeMenu === article.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                <button
                  onClick={() => openInformErrorModal(article.id)}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Informar Error
                </button>
              </div>
            )}
          </div>
        </button>
      </div>

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
    </div>
  );
};

export default ArticleMenu;
