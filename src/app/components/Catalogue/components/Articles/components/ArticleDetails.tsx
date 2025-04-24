"use client";
import React, { useEffect, useMemo, useState } from "react";
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
import { useGetArticlesQuery } from "@/redux/services/articlesApi";
import { useTranslation } from "react-i18next";

interface FormState {
  id: string;
  favourites: string[];
  shopping_cart: string[];
}
interface ArticleDetailsProps {
  article?: any; // Hacemos que sea opcional
  closeModal: () => void;
  showPurchasePrice: boolean;
}


const ArticleDetails = ({ closeModal, showPurchasePrice, article }: ArticleDetailsProps) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);

  
  const { selectedClientId } = useClient();
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

    const { articleId } = useArticleId();

const {
  data: fallbackArticles,
  isLoading: isArticleLoading,
  error: articleError,
} = useGetArticlesQuery(
  {
    page: 1,
    limit: 1,
    articleId: articleId || "",
    priceListId: customer?.price_list_id,
  },
  {
    skip: !!article || !articleId,
  }
);

// Elegir el artículo: prop primero, si no usar el cargado por articleId
const resolvedArticle = useMemo(() => {
  if (article) return article;
  return fallbackArticles?.articles?.[0] || null;
}, [article, fallbackArticles]);


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
    if (!resolvedArticle) return;
    setForm((prev) => {
      const isFavourite = prev.favourites.includes(resolvedArticle.id);
      const updatedFavourites = isFavourite
        ? prev.favourites.filter((id) => id !== resolvedArticle.id)
        : [...prev.favourites, resolvedArticle.id];

      updateCustomer({ id: form.id, favourites: updatedFavourites }).then(() =>
        refetch()
      );

      return { ...prev, favourites: updatedFavourites };
    });
  };

  const toggleShoppingCart = () => {
    if (!resolvedArticle || quantity < 1) return;
    setForm((prev) => {
      const newShoppingCart = [...prev.shopping_cart];
      for (let i = 0; i < quantity; i++) {
        newShoppingCart.push(resolvedArticle.id);
      }

      updateCustomer({ id: form.id, shopping_cart: newShoppingCart }).then(() =>
        refetch()
      );

      return { ...prev, shopping_cart: newShoppingCart };
    });
  };

  if (isCustomerLoading) {
    return <div>{t("loading")}</div>;
  }

  if (customerError) {
    return <div>{t("errorLoadingData")}</div>;
  }

  if (!resolvedArticle) {
    return <div>{t("noArticleSelected")}</div>;
  }

  const isFavourite = form.favourites.includes(resolvedArticle.id);

  return (
    <div className="z-50">
      <div className="flex justify-between">
        <h2 className="text-base font-bold mb-2">{t("articleDetails")}</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <div className="flex gap-4 flex-col sm:justify-center sm:items-start items-center sm:flex-row">
        <div className="h-auto w-64 bg-white rounded-sm border border-gray-200 flex flex-col justify-between pb-2">
          <div className="flex justify-end">
            <ArticleMenu
              onAddToFavourites={toggleFavourite}
              isFavourite={isFavourite}
              article={resolvedArticle}
            />
          </div>
          <ArticleImage img={resolvedArticle.images || [""]} />
          <StripeStock articleId={resolvedArticle.id} />
          <div className="p-3 bg-gray-50">
            <ArticleName
              name={resolvedArticle.name}
              id={resolvedArticle.id}
              code={resolvedArticle.supplier_code}
            />
            <div className="pb-3">
              {showPurchasePrice && (
                <CostPrice
                  article={resolvedArticle}
                  selectedClientId={selectedClientId}
                />
              )}
              <hr className="my-3" />
              <SuggestedPrice article={resolvedArticle} />
            </div>
          </div>
          <AddToCart
            articleId={resolvedArticle.id}
            onAddToCart={toggleShoppingCart}
            quantity={quantity}
            setQuantity={(value) => setQuantity(Math.max(1, value))}
          />
        </div>
        <Description article={resolvedArticle} description={resolvedArticle.description} />
      </div>
    </div>
  );
};

export default ArticleDetails;
