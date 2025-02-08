import React, { useState } from "react";
import { X } from "lucide-react";
import { useGetArticleEquivalenceByArticleIdQuery } from "@/redux/services/articlesEquivalences";

type ArticleEquivalenceProps = {
  articleId: string;
  closeModal: () => void;
};

const ArticleEquivalence = ({ articleId, closeModal }: ArticleEquivalenceProps) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetArticleEquivalenceByArticleIdQuery({ articleId: encodedId });
  return (
    <div className="w-128 z-50 mt-10">
      <div className="flex items-center justify-between p-4 bg-gray-100 rounded-t-lg">
          <h2 className="text-lg font-medium">Equivalencias</h2>
          <button
            onClick={closeModal}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <table className="min-w-full bg-white">
      <thead>
        <tr className="text-xs">
          <th className="py-2 px-4 bg-gray-200 text-left">Brand</th>
          <th className="py-2 px-4 bg-gray-200 text-left">Equivalence Code</th>
        </tr>
      </thead>
      <tbody className="text-xs">
      {data && Array.isArray(data) && data.map((equivalence: any) => (
          <tr key={equivalence.id}>
            <td className="border-t py-2 px-4">
             {equivalence.brand}
            </td>
            <td className="border-t py-2 px-4 max-w-44">
              {equivalence.code}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
};

export default ArticleEquivalence;
