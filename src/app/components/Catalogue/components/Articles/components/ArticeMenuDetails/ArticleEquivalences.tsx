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
    <div className="w-128 z-50 overflow-hidden rounded-2xl bg-[#0B0B0B] border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
        <h2 className="text-lg font-extrabold text-white">
          {t("equivalencesTitle")}{" "}
          <span className="text-white/70">{articleId}</span>
          <span className="text-[#E10600]">.</span>
        </h2>

        <button
          onClick={closeModal}
          className="
          p-1 rounded-full
          bg-white/5 border border-white/10
          text-white
          hover:bg-[#E10600] hover:border-[#E10600]
          transition-all
        "
          aria-label={t("close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabla */}
      <div className="max-h-96 overflow-y-auto hide-scrollbar">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="py-2 px-4 text-left bg-[#0B0B0B] text-white/70 font-semibold border-b border-white/10">
                {t("brand")}
              </th>
              <th className="py-2 px-4 text-left bg-[#0B0B0B] text-white/70 font-semibold border-b border-white/10">
                {t("equivalenceCode")}
              </th>
            </tr>
          </thead>

          <tbody>
            {data &&
              Array.isArray(data) &&
              data.map((equivalence: any, index: number) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="border-b border-white/10 py-2 px-4 text-white">
                    {equivalence.brand}
                  </td>
                  <td className="border-b border-white/10 py-2 px-4 max-w-44 text-white/80">
                    {equivalence.code}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Acento marca */}
      <div className="h-1 w-full bg-[#E10600] opacity-90" />
    </div>
  );
};

export default ArticleEquivalence;
