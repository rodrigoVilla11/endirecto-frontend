import React from 'react';

interface ArticleImageProps {
  img: any;
}

const ArticleImage: React.FC<ArticleImageProps> = ({ img }) => {
  return (
    <div className='flex justify-center mb-4 p-4 bg-white'>
      <img className='w-32 h-40 object-contain' src={img} alt="Artículo" />
    </div>
  );
}

export default ArticleImage;
