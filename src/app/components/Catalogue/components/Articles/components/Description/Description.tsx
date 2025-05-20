import React from "react";
import Tables from "./components/Tables";
import { useTranslation } from "react-i18next";

const Description = ({ article, description }: any) => {
  const { t } = useTranslation();

  return (
    <div className="w-80">
      <h3 className="font-bold">{t("description")}</h3>
      <p className="font-light max-w-full break-words overflow-hidden max-h-36 text-sm">
        {description}
      </p>
      <Tables article={article} />
    </div>
  );
};

export default Description;
