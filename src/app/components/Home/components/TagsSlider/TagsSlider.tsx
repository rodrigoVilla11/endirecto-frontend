'use client';
import React from 'react';
import { useGetMarketingByFilterQuery } from '@/redux/services/marketingApi';
import ButtonsImage from './ButtonsImage';

const SliderTags = () => {
  const filterBy = 'tags';
  const { data: marketing } = useGetMarketingByFilterQuery({ filterBy });

  const logos = marketing?.length
    ? marketing.map((tag) => ({
        id: tag._id,
        tag: tag.tags.name,
        logo: tag.tags.image,
      }))
    : [];

  if (logos.length === 0) {
    return <div className="text-center py-4">No hay datos disponibles</div>;
  }

  return (
    <div className="w-full p-4 flex justify-center items-center gap-6" id="tags">
      {logos.slice(0, 4).map((logo) => ( // Muestra solo las primeras 4 imágenes
        <div
          key={logo.id}
          className="flex items-center justify-center w-full h-auto bg-white overflow-hidden"
        >
          <ButtonsImage logo={logo.logo} name={logo.tag} />
        </div>
      ))}
    </div>
  );
};

export default SliderTags;
