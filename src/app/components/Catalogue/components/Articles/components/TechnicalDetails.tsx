import { useGetArticleTechnicalDetailByArticleIdQuery } from "@/redux/services/articlesTechnicalDetailsApi";
import React from "react";

const TechnicalDetails = ({ articleId, technicalDetailId }: any) => {
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } =
    useGetArticleTechnicalDetailByArticleIdQuery({ articleId: encodedId });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  // Verificar si data es un array y luego buscar el detalle
  const technicalDetail = Array.isArray(data)
    ? data.find((detail: any) => detail.technical_detail_id === technicalDetailId)
    : null;

  return (
    <div className="">
      {technicalDetail ? (
        <div className="">
          {technicalDetail.value || "No Value"}
        </div>
      ) : (
        <p>No technical detail found</p>
      )}
    </div>
  );
};

export default TechnicalDetails;
