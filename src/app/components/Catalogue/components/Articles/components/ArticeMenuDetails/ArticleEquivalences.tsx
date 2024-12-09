import React, { useState } from "react";
import { X } from "lucide-react";

type ArticleEquivalenceProps = {
  articleId: string;
  closeModal: () => void;
};

const ArticleEquivalence = ({ articleId, closeModal }: ArticleEquivalenceProps) => {

  return (
    <div className="p-6 w-128">
      <div className="flex items-center justify-between p-4 bg-gray-100 rounded-t-lg">
          <h2 className="text-lg font-medium">Equivalencias</h2>
          <button
            onClick={closeModal}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      <p>{articleId}</p>
    </div>
  );
};

export default ArticleEquivalence;
