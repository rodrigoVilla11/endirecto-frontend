import React from "react";
import { useArticleComparation } from "@/app/context/ComparationArticles";

type ArticlesComparationProps = {
  closeModal: () => void;
};

const ArticlesComparation = ({ closeModal }: ArticlesComparationProps) => {
  const { articleIds } = useArticleComparation();

  return (
    <div className="p-6 w-128">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Informar Error</h2>
      <div className="mb-4">
        {/* Mapea y muestra cada artículo */}
        {articleIds.map((article) => (
          <p key={article.id} className="font-bold text-gray-800">
            {article.name} {/* Aquí accedes al nombre del artículo */}
          </p>
        ))}
      </div>

      <div className="flex justify-end mt-6 gap-4">
        <button
          type="button"
          onClick={closeModal}
          className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ArticlesComparation;
