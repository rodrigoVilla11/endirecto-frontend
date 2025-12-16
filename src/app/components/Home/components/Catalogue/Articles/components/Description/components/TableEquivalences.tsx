import {
  useGetArticleEquivalenceByArticleIdQuery,
  useGetArticleEquivalenceByIdQuery,
} from "@/redux/services/articlesEquivalences";
import React from "react";

const TableEquivalences = ({ articleId }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetArticleEquivalenceByArticleIdQuery({
    articleId: encodedId,
  });
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full text-sm text-white">
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            <th className="py-2 px-4 text-left font-extrabold text-white/80">
              Brand
            </th>
            <th className="py-2 px-4 text-left font-extrabold text-white/80">
              Equivalence Code
            </th>
          </tr>
        </thead>

        <tbody className="text-xs">
          {data &&
            Array.isArray(data) &&
            data.map((equivalence: any) => (
              <tr
                key={equivalence.id}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-2 px-4 border-b border-white/10 text-white/80">
                  {equivalence.brand}
                </td>
                <td className="py-2 px-4 border-b border-white/10 text-white max-w-44 truncate">
                  {equivalence.code}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableEquivalences;
