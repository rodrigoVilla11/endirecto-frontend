import React from 'react';

interface BrandsCardsProps {
  brand: string;
  logo: string;
  handleRedirect: (path: string) => void;
}

const BrandsCards: React.FC<BrandsCardsProps> = ({ brand, logo, handleRedirect }) => {
  return (
    <div onClick={() => handleRedirect(`/brand/${brand}`)} className="w-24 h-24 bg-white shadow-2xl flex items-center justify-center">
      <img src={logo} alt={brand} className="w-20 h-20 object-contain object-center bg-white " />
    </div>
  );
};

export default BrandsCards;
