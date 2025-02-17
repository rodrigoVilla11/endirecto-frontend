import { useGetArticleTechnicalDetailByArticleIdQuery } from '@/redux/services/articlesTechnicalDetailsApi';
import { useGetTechnicalDetailByIdQuery, useGetTechnicalDetailsQuery } from '@/redux/services/technicalDetails';
import React from 'react';
import TechnicalDetail from './TechnicalDetail';
import { useTranslation } from 'react-i18next';

const TableTechnicalDetails = ({ articleId }: any) => {
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetArticleTechnicalDetailByArticleIdQuery({ articleId: encodedId });

  if (isLoading) return <p>{t("loading")}</p>;
  if (error) return <p>{t("error")}</p>;

  return (
    <table className="min-w-full bg-white text-xs">
      <thead>
        <tr className='font-medium'>
          <th className="py-2 px-4 bg-gray-200 text-left">{t("technicalCharacteristics")}</th>
          <th className="py-2 px-4 bg-gray-200 text-left">{t("value")}</th>
        </tr>
      </thead>
      <tbody className="text-xs">
        {data && Array.isArray(data) && data.map((technicalDetail: any) => (
          <tr key={technicalDetail.id}>
            <td className="border-t py-2 px-4">
              <TechnicalDetail technical_detail_id={technicalDetail.technical_detail_id}/>
            </td>
            <td className="border-t py-2 px-4 max-w-28">
              {technicalDetail.value || t("noValue")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableTechnicalDetails;
