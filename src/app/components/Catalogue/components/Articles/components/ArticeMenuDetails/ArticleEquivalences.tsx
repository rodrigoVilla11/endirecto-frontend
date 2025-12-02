import React from "react";
import { X } from "lucide-react";
import { useGetArticleEquivalenceByArticleIdQuery } from "@/redux/services/articlesEquivalences";
import { useTranslation } from "react-i18next";

type ArticleEquivalenceProps = {
  articleId: string;
  closeModal: () => void;
};

const ArticleEquivalence = ({
  articleId,
  closeModal,
}: ArticleEquivalenceProps) => {
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetArticleEquivalenceByArticleIdQuery({
    articleId: encodedId,
  });

  return (
    <div className="w-128 z-50 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-100 rounded-t-lg">
        <h2 className="text-lg font-medium">{t("equivalencesTitle")}  {articleId}</h2>
        <button
          onClick={closeModal}
          className="p-1 hover:bg-gray-200 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto scrollbar-hide">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="text-xs">
            <th className="py-2 px-4 bg-gray-200 text-left">{t("brand")}</th>
            <th className="py-2 px-4 bg-gray-200 text-left">
              {t("equivalenceCode")}
            </th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {data &&
            Array.isArray(data) &&
            data.map((equivalence: any, index) => (
              <tr key={index}>
                <td className="border-t py-2 px-4">{equivalence.brand}</td>
                <td className="border-t py-2 px-4 max-w-44">
                  {equivalence.code}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default ArticleEquivalence;
