"use client";
import React from 'react';
import { useGetMarketingByFilterQuery } from '@/redux/services/marketingApi';
import ButtonsImage from './ButtonsImage';
import { useMobile } from '@/app/context/ResponsiveContext';
import { useTranslation } from 'react-i18next';

const SliderTags = () => {
  const { t } = useTranslation();
  const filterBy = 'tags';
  const { data: marketing } = useGetMarketingByFilterQuery({ filterBy });
  const { isMobile } = useMobile();

  const logos = marketing?.length
    ? marketing.map((tag) => ({
        id: tag._id,
        tag: tag.tags.name,
        logo: tag.tags.image,
      }))
    : [];

  if (logos.length === 0) {
    return <div className="text-center py-4">{t("noDataAvailable")}</div>;
  }

  return (
    <div className={`w-full p-4 flex ${isMobile ? "flex-col" : ""} justify-center items-center gap-6`} id="tags">
      {logos.slice(0, 4).map((logo) => ( // Muestra solo las primeras 4 imágenes
        <div
          key={logo.id}
          className="flex items-center justify-center w-full h-auto overflow-hidden"
        >
          <ButtonsImage logo={logo.logo} name={logo.tag} />
        </div>
      ))}
    </div>
  );
};

export default SliderTags;
