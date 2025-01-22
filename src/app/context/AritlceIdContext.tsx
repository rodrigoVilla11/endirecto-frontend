"use client";
import React, { createContext, useContext, useState } from 'react';

interface ArticleIdContextType {
  articleId: string | null;
  setArticleId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ArticleIdContext = createContext<ArticleIdContextType | null>(null);

export const ArticleIdProvider = ({ children }: any) => {
  const [articleId, setArticleId] = useState<string | null>(null);

  return (
    <ArticleIdContext.Provider value={{ articleId, setArticleId }}>
      {children}
    </ArticleIdContext.Provider>
  );
};

// Ajuste en el hook para manejar el caso nulo
export const useArticleId = () => {
  const context = useContext(ArticleIdContext);
  if (!context) {
    throw new Error("useArticleId must be used within an ArticleIdProvider");
  }
  return context;
};
