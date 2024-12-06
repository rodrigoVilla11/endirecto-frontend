"use client"
import React, { createContext, useContext, useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import Modal from "../components/components/Modal";
import ArticlesComparation from "../components/Catalogue/components/Articles/components/ArticeMenuDetails/ArticlesComparation";



interface ArticleComparationContextType {
  articleIds: any;
  setArticleIds: React.Dispatch<React.SetStateAction<any>>;
  addArticleId: (article: any) => void;
  removeArticleId: (id: string) => void;
}

const ArticleComparationContext =
  createContext<ArticleComparationContextType | null>(null);

export const ArticleComparationProvider = ({ children }: any) => {
  const [articleIds, setArticleIds] = useState<any>([]);

  const addArticleId = (article: any) => {
    setArticleIds((prevIds: any) => [...prevIds, article]);
  };

  const removeArticleId = (id: string) => {
    setArticleIds((prevIds :any) => prevIds.filter((article :any) => article.id !== id));
  };

  return (
    <ArticleComparationContext.Provider
      value={{ articleIds, setArticleIds, addArticleId, removeArticleId }}
    >
      {children}
    </ArticleComparationContext.Provider>
  );
};

export const useArticleComparation = () => {
  const context = useContext(ArticleComparationContext);
  if (!context) {
    throw new Error(
      "useArticleComparation must be used within an ArticleComparationProvider"
    );
  }
  return context;
};

const FixedBottomScreen = () => {
  const { articleIds, removeArticleId, setArticleIds } = useArticleComparation();
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleRemoveArticle = (id: string) => {
    removeArticleId(id); // Eliminar artículo por su ID
  };

  const handleClearSelection = () => {
    setArticleIds([]); // Eliminar todos los artículos
  };

  // Mostrar solo si hay artículos en articleIds
  if (articleIds.length === 0) {
    return null; // Si no hay artículos, no mostramos nada
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-50 shadow-md p-4 pl-24 text-white">
      {/* Botones de "Borrar Selección" y "Comparar" */}
      <div className="absolute top-0 right-0 p-4 space-x-4 sflex">
        <button
          onClick={handleClearSelection}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Borrar Selección
        </button>
        <button className="bg-green-500 text-white p-2 rounded hover:bg-green-600" onClick={openModal}>
          Comparar
        </button>
      </div>

      {/* Contenedor de artículos, uno al lado del otro */}
      <div className="flex space-x-4 overflow-x-auto mt-16">
        <ul className="flex space-x-4">
          {articleIds.map((article : any) => {
            return (
              <div key={article.id} className="relative h-24 w-20">
                {/* Botón de remove en la parte superior izquierda */}
                <button
                  onClick={() => handleRemoveArticle(article.id)}
                  className="absolute top-0 left-0 p-2 text-red-500 cursor-pointer hover:text-red-700"
                >
                  <FaTrashAlt size={20} /> {/* Ícono de basura */}
                </button>

                {/* Contenedor para la imagen, nombre y ID */}
                <div className="flex flex-col items-center space-y-2">
                  {/* Imagen del artículo */}
                  <img
                    src={article.images ? article.images[0] : ""}
                    alt={article.name}
                    className="w-16 h-20 object-contain"
                  />
                </div>
              </div>
            );
          })}
        </ul>
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticlesComparation closeModal={closeModal}/>
      </Modal>
    </div>
  );
};

export default FixedBottomScreen;
