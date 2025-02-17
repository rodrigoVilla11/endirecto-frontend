import { useGetArticleEquivalenceByArticleIdQuery } from "@/redux/services/articlesEquivalences";
import React from "react";
import { useTranslation } from "react-i18next";

const TableEquivalences = ({ articleId }: any) => {
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetArticleEquivalenceByArticleIdQuery({ articleId: encodedId });
  
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr className="text-xs">
          <th className="py-2 px-4 bg-gray-200 text-left">{t("brand")}</th>
          <th className="py-2 px-4 bg-gray-200 text-left">{t("equivalenceCode")}</th>
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
  );
};

export default TableEquivalences;
