import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import ArticleMenu from "./ArticleMenu";
import ArticleImage from "./ArticleImage";
import StripeStock from "./StripeStock";
import ArticleName from "./ArticleName";
import CostPrice from "./CostPrice";
import SuggestedPrice from "./SuggestedPrice";
import AddToCart from "./AddToCart";
import Description from "./Description/Description";
import { useClient } from "@/app/context/ClientContext";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import { useArticleId } from "@/app/context/AritlceIdContext";
import { useGetArticleByIdQuery } from "@/redux/services/articlesApi";

interface FormState {
  id: string;
  favourites: string[];
  shopping_cart: string[];
}

const ArticleDetails = ({ closeModal }: any) => {
  const { selectedClientId } = useClient();
  const [quantity, setQuantity] = useState(1);
  const { articleId } = useArticleId();
  const encodedId = encodeURIComponent(articleId || "");

  const { data: article, isLoading: isArticleLoading, error: articleError } = 
    useGetArticleByIdQuery({ id: encodedId || "" }, { skip: !encodedId });

  const {
    data: customer,
    error: customerError,
    isLoading: isCustomerLoading,
    refetch,
  } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  const [updateCustomer, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCustomerMutation();

  const [form, setForm] = useState<FormState>({
    id: "",
    favourites: [],
    shopping_cart: [],
  });

  useEffect(() => {
    if (customer) {
      setForm({
        id: customer.id || "",
        favourites: customer.favourites || [],
        shopping_cart: customer.shopping_cart || [],
      });
    }
  }, [customer]);

  const toggleFavourite = () => {
    if (!article) return;
    setForm((prev) => {
      const isFavourite = prev.favourites.includes(article.id);
      const updatedFavourites = isFavourite
        ? prev.favourites.filter((id) => id !== article.id)
        : [...prev.favourites, article.id];

      updateCustomer({ id: form.id, favourites: updatedFavourites }).then(
        () => refetch()
      );

      return { ...prev, favourites: updatedFavourites };
    });
  };

  const toggleShoppingCart = () => {
    if (!article || quantity < 1) return;
    setForm((prev) => {
      const newShoppingCart = [...prev.shopping_cart];
      for (let i = 0; i < quantity; i++) {
        newShoppingCart.push(article.id);
      }

      updateCustomer({ id: form.id, shopping_cart: newShoppingCart }).then(
        () => refetch()
      );

      return { ...prev, shopping_cart: newShoppingCart };
    });
  };

  if (isCustomerLoading || isArticleLoading) {
    return <div>Loading...</div>;
  }

  if (customerError || articleError) {
    return (
      <div>
        Error loading data
      </div>
    );
  }

  if (!article) {
    return <div>No article selected</div>;
  }

  const isFavourite = form.favourites.includes(article.id);

  return (
    <div className="z-50">
      <div className="flex justify-between">
        <h2 className="text-lg mb-2">Article Details</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <div className="flex gap-4 flex-col sm:justify-center sm:items-start items-center sm:flex-row">
        <div className="h-auto w-64 bg-white rounded-sm border border-gray-200 flex flex-col justify-between">
          <ArticleMenu
            onAddToFavourites={toggleFavourite}
            isFavourite={isFavourite}
            article={article}
          />
          <ArticleImage img={article.images || [""]} />
          <StripeStock articleId={article.id} />
          <ArticleName
            name={article.name}
            id={article.id}
            code={article.supplier_code}
          />
          <div className="pb-3">
            <CostPrice
              articleId={article.id}
              selectedClientId={selectedClientId}
            />
            <hr className="my-3" />
            <SuggestedPrice articleId={article.id} />
          </div>
          <AddToCart
            articleId={article.id}
            onAddToCart={toggleShoppingCart}
            quantity={quantity}
            setQuantity={(value) => setQuantity(Math.max(1, value))}
          />
        </div>
        <Description article={article} description={article.description} />
      </div>
    </div>
  );
};

export default ArticleDetails;
