import { useGetArticleEquivalenceByArticleIdQuery } from "@/redux/services/articlesEquivalences";
import React from "react";
import { useTranslation } from "react-i18next";

const TableEquivalences = ({ articleId }: any) => {
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetArticleEquivalenceByArticleIdQuery({
    articleId: encodedId,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#E10600]" />
      </div>
    );

  if (error)
    return (
      <div className="text-center text-[#E10600] py-8 font-semibold">
        <p>{t("error")}</p>
      </div>
    );

  if (!data)
    return (
      <div className="text-center text-white/60 py-8 italic">
        <p>{t("noEquivalences")}</p>
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-2xl">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="py-3 px-4 text-left font-bold text-white/70 bg-[#0B0B0B] border-b border-white/10">
              {t("brand")}
            </th>
            <th className="py-3 px-4 text-left font-bold text-white/70 bg-[#0B0B0B] border-b border-white/10">
              {t("equivalenceCode")}
            </th>
          </tr>
        </thead>

        <tbody>
          {Array.isArray(data) &&
            data.map((equivalence: any, index: number) => (
              <tr
                key={index}
                className={`
                border-b border-white/10
                transition-colors
                ${index % 2 === 0 ? "bg-white/0" : "bg-white/5"}
                hover:bg-white/10
              `}
              >
                <td className="py-3 px-4 font-medium text-white">
                  {equivalence.brand}
                </td>
                <td className="py-3 px-4 text-white/80">{equivalence.code}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Acento marca */}
      <div className="h-1 w-full bg-[#E10600] opacity-90" />
    </div>
  );
};

export default TableEquivalences;
