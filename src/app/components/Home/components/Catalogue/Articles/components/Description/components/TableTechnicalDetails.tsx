import { useGetArticleTechnicalDetailByArticleIdQuery } from "@/redux/services/articlesTechnicalDetailsApi";
import {
  useGetTechnicalDetailByIdQuery,
  useGetTechnicalDetailsQuery,
} from "@/redux/services/technicalDetails";
import React from "react";
import TechnicalDetail from "./TechnicalDetail";

const TableTechnicalDetails = ({ articleId }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } =
    useGetArticleTechnicalDetailByArticleIdQuery({ articleId: encodedId });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full text-sm text-white">
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            <th className="py-2 px-4 text-left font-extrabold text-white/80">
              Technical Characteristics
            </th>
            <th className="py-2 px-4 text-left font-extrabold text-white/80">
              Value
            </th>
          </tr>
        </thead>

        <tbody className="text-xs">
          {data &&
            Array.isArray(data) &&
            data.map((technicalDetail: any) => (
              <tr
                key={technicalDetail.id}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-2 px-4 border-b border-white/10 text-white/80">
                  <TechnicalDetail
                    technical_detail_id={technicalDetail.technical_detail_id}
                  />
                </td>
                <td className="py-2 px-4 border-b border-white/10 text-white max-w-28 truncate">
                  {technicalDetail.value || "No Value"}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableTechnicalDetails;
