import { useGetArticleTechnicalDetailByArticleIdQuery } from '@/redux/services/articlesTechnicalDetailsApi';
import React from 'react';
import TechnicalDetail from './TechnicalDetail';
import { useTranslation } from 'react-i18next';

const TableTechnicalDetails = ({ articleId }: any) => {
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetArticleTechnicalDetailByArticleIdQuery({ articleId: encodedId });
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

if (!data || data.length === 0)
  return (
    <div className="text-center text-white/60 py-8 italic">
      <p>{t("noTechnicalDetails")}</p>
    </div>
  );

return (
  <div className="overflow-x-auto rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-2xl">
    <table className="min-w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr>
          <th className="py-3 px-4 text-left font-bold text-white/70 bg-[#0B0B0B] border-b border-white/10">
            {t("technicalCharacteristics")}
          </th>
          <th className="py-3 px-4 text-left font-bold text-white/70 bg-[#0B0B0B] border-b border-white/10">
            {t("value")}
          </th>
        </tr>
      </thead>

      <tbody>
        {data.map((technicalDetail: any, index: number) => (
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
              <TechnicalDetail
                technical_detail_id={technicalDetail.technical_detail_id}
              />
            </td>

            <td className="py-3 px-4 text-white/80">
              {technicalDetail.value || (
                <span className="italic text-white/50">
                  {t("noValue")}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Acento marca */}
    <div className="h-1 w-full bg-[#E10600] opacity-90" />
  </div>
);

};

export default TableTechnicalDetails;