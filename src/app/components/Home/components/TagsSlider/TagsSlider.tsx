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
    return (
      <div className="w-full py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-6">
          <span className="text-5xl mb-4 block">🏷️</span>
          <p className="text-gray-700 font-bold">{t("noDataAvailable")}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50`} 
      id="tags"
    >
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
          🎯 {t("featuredCategories") || "Categorías Destacadas"}
        </h2>
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"} gap-6`}>
          {logos.slice(0, 4).map((logo) => (
            <div
              key={logo.id}
              className="flex items-center justify-center overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <ButtonsImage logo={logo.logo} name={logo.tag} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SliderTags;