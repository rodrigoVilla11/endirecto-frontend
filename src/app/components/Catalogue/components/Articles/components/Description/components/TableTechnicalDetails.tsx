import { useGetArticleTechnicalDetailByArticleIdQuery } from '@/redux/services/articlesTechnicalDetailsApi';
import { useGetTechnicalDetailByIdQuery, useGetTechnicalDetailsQuery } from '@/redux/services/technicalDetails';
import React from 'react';
import TechnicalDetail from './TechnicalDetail';

const TableTechnicalDetails = ({ articleId }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } = useGetArticleTechnicalDetailByArticleIdQuery({ articleId: encodedId });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  
  return (
    <table className="min-w-full bg-white text-xs">
      <thead>
        <tr className='font-medium'>
          <th className="py-2 px-4 bg-gray-200 text-left">Technical Characteristics</th>
          <th className="py-2 px-4 bg-gray-200 text-left">Value</th>
        </tr>
      </thead>
      <tbody className="text-xs">
        {data && Array.isArray(data) && data.map((technicalDetail: any) => (
          <tr key={technicalDetail.id}>
            <td className="border-t py-2 px-4">
              <TechnicalDetail technical_detail_id={technicalDetail.technical_detail_id}/>
            </td>
            <td className="border-t py-2 px-4 max-w-28">
              {technicalDetail.value || 'No Value'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableTechnicalDetails;
