import React from "react";
import { IoMdClose } from "react-icons/io";
import ArticleMenu from "./ArticleMenu";
import ArticleImage from "./ArticleImage";
import StripeStock from "./StripeStock";
import ArticleName from "./ArticleName";
import CostPrice from "./CostPrice";
import SuggestedPrice from "./SuggestedPrice";
import AddToCart from "./AddToCart";
import Description from "./Description/Description";

const ArticleDetails = ({closeModal, toggleFavourite, isFavourite, article, toggleShoppingCart, quantity, setQuantity} : any) => {
  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">Article Details</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <div className="flex gap-4">
        <div className="h-116 w-72 bg-white rounded-sm border border-gray-200 flex flex-col justify-between">
          <ArticleMenu
          />
          <ArticleImage img={article.images} />
          <ArticleName name={article.name} id={article.id} />
        </div>
        <Description article={article} description={article.description} />
      </div>
    </div>
  );
};

export default ArticleDetails;
