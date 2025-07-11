"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  article?: any;
  closeModal: () => void;
  showPurchasePrice: boolean;
}

const ArticleDetails = ({ closeModal, showPurchasePrice, article }: ArticleDetailsProps) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const { selectedClientId } = useClient();
  const { articleId } = useArticleId();

  // Customer query
  const {
    data: customer,
    error: customerError,
    isLoading: isCustomerLoading,
    refetch,
  } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  // Article query (solo si no hay article prop)
  const {
    data: fallbackArticles,
    isLoading: isArticleLoading,
    error: articleError,
  } = useGetArticlesQuery(
    {
      page: 1,
      limit: 1,
      articleId: articleId || "",
      priceListId: customer?.price_list_id || "",
    },
    {
      skip: !!article || !articleId || !customer?.price_list_id,
    }
  );

  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  // Resolver el artículo
  const resolvedArticle = useMemo(() => {
    if (article) return article;
    return fallbackArticles?.articles?.[0] || null;
  }, [article, fallbackArticles]);

  // Estado del formulario
  const [form, setForm] = useState<FormState>({
    id: customer?.id || "",
    favourites: customer?.favourites || [],
    shopping_cart: customer?.shopping_cart || [],
  });

  // Actualizar form cuando cambia customer
  useEffect(() => {
    if (customer) {
      setForm({
        id: customer.id || "",
        favourites: customer.favourites || [],
        shopping_cart: customer.shopping_cart || [],
      });
    }
  }, [customer]);

  // Handlers optimizados
  const toggleFavourite = useCallback(async () => {
    if (!resolvedArticle || !form.id) return;
    
    const isFavourite = form.favourites.includes(resolvedArticle.id);
    const updatedFavourites = isFavourite
      ? form.favourites.filter((id) => id !== resolvedArticle.id)
      : [...form.favourites, resolvedArticle.id];

    // Actualización optimista
    setForm(prev => ({ ...prev, favourites: updatedFavourites }));

    try {
      await updateCustomer({ id: form.id, favourites: updatedFavourites }).unwrap();
      refetch();
    } catch (error) {
      // Revertir en caso de error
      console.error("Error updating favourites:", error);
      refetch();
    }
  }, [resolvedArticle, form.id, form.favourites, updateCustomer, refetch]);

  const toggleShoppingCart = useCallback(async () => {
    if (!resolvedArticle || quantity < 1 || !form.id) return;
    
    const newShoppingCart = [...form.shopping_cart];
    for (let i = 0; i < quantity; i++) {
      newShoppingCart.push(resolvedArticle.id);
    }

    // Actualización optimista
    setForm(prev => ({ ...prev, shopping_cart: newShoppingCart }));

    try {
      await updateCustomer({ id: form.id, shopping_cart: newShoppingCart }).unwrap();
      refetch();
      // Reset quantity después de agregar
      setQuantity(1);
    } catch (error) {
      console.error("Error updating shopping cart:", error);
      refetch();
    }
  }, [resolvedArticle, quantity, form.id, form.shopping_cart, updateCustomer, refetch]);

  const handleQuantityChange = useCallback((value: number) => {
    setQuantity(Math.max(1, value));
  }, []);

  // Loading state
  const isLoading = isCustomerLoading || (!article && isArticleLoading);
  
  // Verificar si es favorito
  const isFavourite = useMemo(() => 
    resolvedArticle && form.favourites.includes(resolvedArticle.id),
    [resolvedArticle, form.favourites]
  );

  // Renderizado del contenido
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (customerError || articleError) {
      return (
        <div className="flex justify-center items-center h-96">
          <p className="text-red-500">{t("errorLoadingData")}</p>
        </div>
      );
    }

    if (!resolvedArticle) {
      return (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">{t("noArticleSelected")}</p>
        </div>
      );
    }

    return (
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
            setQuantity={handleQuantityChange}
            disabled={isUpdating}
          />
        </div>
        <Description 
          article={resolvedArticle} 
          description={resolvedArticle.description} 
        />
      </div>
    );
  };

  return (
    <div className="z-50 min-h-[400px]" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between mb-4">
        <h2 className="text-base font-bold">{t("articleDetails")}</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center transition-colors"
          aria-label={t("close")}
        >
          <IoMdClose />
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default ArticleDetails;