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
import { useMobile } from "@/app/context/ResponsiveContext";
import Tag from "@/app/components/Home/components/Catalogue/Articles/components/Tag";

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

const ArticleDetails = ({
  closeModal,
  showPurchasePrice,
  article,
}: ArticleDetailsProps) => {
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const [quantity, setQuantity] = useState(1);
  const { selectedClientId } = useClient();
  const { articleId } = useArticleId();

  const {
    data: customer,
    error: customerError,
    isLoading: isCustomerLoading,
    refetch,
  } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

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

  const [updateCustomer, { isLoading: isUpdating }] =
    useUpdateCustomerMutation();

  const resolvedArticle = useMemo(() => {
    if (article) return article;
    return fallbackArticles?.articles?.[0] || null;
  }, [article, fallbackArticles]);

  const [form, setForm] = useState<FormState>({
    id: customer?.id || "",
    favourites: customer?.favourites || [],
    shopping_cart: customer?.shopping_cart || [],
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

  const toggleFavourite = useCallback(async () => {
    if (!resolvedArticle || !form.id) return;

    const isFavourite = form.favourites.includes(resolvedArticle.id);
    const updatedFavourites = isFavourite
      ? form.favourites.filter((id) => id !== resolvedArticle.id)
      : [...form.favourites, resolvedArticle.id];

    setForm((prev) => ({ ...prev, favourites: updatedFavourites }));

    try {
      await updateCustomer({ id: form.id, favourites: updatedFavourites }).unwrap();
      refetch();
    } catch (error) {
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

    setForm((prev) => ({ ...prev, shopping_cart: newShoppingCart }));

    try {
      await updateCustomer({
        id: form.id,
        shopping_cart: newShoppingCart,
      }).unwrap();
      refetch();
      setQuantity(1);
    } catch (error) {
      console.error("Error updating shopping cart:", error);
      refetch();
    }
  }, [resolvedArticle, quantity, form.id, form.shopping_cart, updateCustomer, refetch]);

  const handleQuantityChange = useCallback((value: number) => {
    setQuantity(Math.max(1, value));
  }, []);

  const isLoading = isCustomerLoading || (!article && isArticleLoading);

  const isFavourite = useMemo(
    () => resolvedArticle && form.favourites.includes(resolvedArticle.id),
    [resolvedArticle, form.favourites]
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-96 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-2xl">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-600">
            {t("loading")}...
          </p>
        </div>
      );
    }

    if (customerError || articleError) {
      return (
        <div className="flex flex-col justify-center items-center h-96 bg-red-50 rounded-2xl p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold">
            {t("errorLoadingData")}
          </p>
        </div>
      );
    }

    if (!resolvedArticle) {
      return (
        <div className="flex flex-col justify-center items-center h-96 bg-gray-50 rounded-2xl p-8">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-500 font-medium">
            {t("noArticleSelected")}
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Card del artículo */}
        <div className="w-full lg:max-w-md xl:max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header con iconos y tag */}
          <div className="relative">
            <div className="absolute top-3 left-3 right-3 z-30 flex justify-between items-start">
              {/* Indicador de stock */}
              <div className="flex-shrink-0">
                <StripeStock articleId={resolvedArticle.id} />
              </div>

              {/* Iconos del menú */}
              <div className="flex items-center gap-1">
                <ArticleMenu
                  onAddToFavourites={toggleFavourite}
                  isFavourite={!!isFavourite}
                  article={resolvedArticle}
                />
              </div>
            </div>

            {/* Tag */}
            {resolvedArticle.tag && (
              <div className="absolute top-10 left-3 z-20">
                <Tag tag={resolvedArticle.tag} />
              </div>
            )}

            {/* Imagen */}
            <div className="bg-white pt-12 px-4 pb-4">
              <div className="h-56 flex items-center justify-center">
                <ArticleImage img={resolvedArticle.images || [""]} />
              </div>
            </div>
          </div>

          {/* Información del producto */}
          <div className="px-6 pb-4 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <ArticleName
                name={resolvedArticle.name}
                id={resolvedArticle.id}
                code={resolvedArticle.supplier_code}
              />

              {showPurchasePrice && (
                <>
                  <CostPrice
                    article={resolvedArticle}
                    selectedClientId={selectedClientId}
                  />
                  <div className="border-t border-gray-200" />
                </>
              )}

              <SuggestedPrice
                article={resolvedArticle}
                showPurchasePrice={showPurchasePrice}
              />
            </div>
          </div>

          {/* Sección de agregar al carrito */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <AddToCart
              articleId={resolvedArticle.id}
              onAddToCart={toggleShoppingCart}
              quantity={quantity}
              setQuantity={handleQuantityChange}
              disabled={isUpdating}
            />
          </div>

          {/* Barra de stock inferior */}
          <div className="w-full">
            <StripeStock articleId={resolvedArticle.id} isBar />
          </div>
        </div>

        {/* Descripción */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <Description
            article={resolvedArticle}
            description={resolvedArticle.description}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className="z-50 min-h-[400px] max-h-[90vh] overflow-y-auto hide-scrollbar bg-white p-4 sm:p-6 rounded-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header del modal */}
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-40 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold bg-gradient-to-r from-red-500 via-white to-blue-500 bg-clip-text text-transparent">
          {t("articleDetails")}
        </h2>
        <button
          onClick={closeModal}
          className="bg-gradient-to-r from-red-500 via-white to-blue-500 hover:opacity-90 text-black rounded-full h-8 w-8 flex justify-center items-center transition-all shadow-md hover:shadow-lg"
          aria-label={t("close")}
        >
          <IoMdClose className="text-lg" />
        </button>
      </div>

      {/* Contenido */}
      {renderContent()}
    </div>
  );
};

export default ArticleDetails;
