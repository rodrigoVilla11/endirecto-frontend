import { useGetArticleTechnicalDetailByArticleIdQuery } from '@/redux/services/articlesTechnicalDetailsApi';
import React from 'react';
import TechnicalDetail from './TechnicalDetail';
import { useTranslation } from 'react-i18next';

const TableTechnicalDetails = ({ articleId }: any) => {
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetArticleTechnicalDetailByArticleIdQuery({ articleId: encodedId });

  if (isLoading) return (
    <div className="flex justify-center items-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="text-center text-red-500 py-8">
      <p>{t("error")}</p>
    </div>
  );

  if (!data || data.length === 0) return (
    <div className="text-center text-gray-500 py-8">
      <p>{t("noTechnicalDetails")}</p>
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
            <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">
              {t("technicalCharacteristics")}
            </th>
            <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">
              {t("value")}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((technicalDetail: any, index: number) => (
            <tr 
              key={index}
              className={`border-t border-gray-200 hover:bg-gradient-to-r hover:from-pink-50 hover:via-purple-50 hover:to-blue-50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <td className="py-3 px-4 text-sm font-medium text-gray-700">
                <TechnicalDetail technical_detail_id={technicalDetail.technical_detail_id}/>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">
                {technicalDetail.value || t("noValue")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableTechnicalDetails;