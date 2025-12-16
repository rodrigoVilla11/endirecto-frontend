"use client";
import { useGetArticleTechnicalDetailByArticleIdQuery } from "@/redux/services/articlesTechnicalDetailsApi";
import React from "react";
import { useTranslation } from "react-i18next";

const TechnicalDetails = ({ articleId, technicalDetailId }: any) => {
  const { t } = useTranslation();
  const encodedId = encodeURIComponent(articleId);
  const { data, error, isLoading } =
    useGetArticleTechnicalDetailByArticleIdQuery({ articleId: encodedId });

  if (isLoading) return <p>{t("loading")}</p>;
  if (error) return <p>{t("error")}</p>;

  // Verificar si data es un array y luego buscar el detalle
  const technicalDetail = Array.isArray(data)
    ? data.find(
        (detail: any) => detail.technical_detail_id === technicalDetailId
      )
    : null;

  return (
    <div>
      {technicalDetail ? (
        <div className="text-white font-medium text-sm">
          {technicalDetail.value || (
            <span className="text-white/60 italic">{t("noValue")}</span>
          )}
        </div>
      ) : (
        <p className="text-white/60 text-sm italic">
          {t("noTechnicalDetailFound")}
        </p>
      )}
    </div>
  );
};

export default TechnicalDetails;
