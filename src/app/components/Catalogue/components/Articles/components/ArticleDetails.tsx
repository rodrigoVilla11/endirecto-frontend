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
      await updateCustomer({
        id: form.id,
        favourites: updatedFavourites,
      }).unwrap();
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
  }, [
    resolvedArticle,
    quantity,
    form.id,
    form.shopping_cart,
    updateCustomer,
    refetch,
  ]);

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
        <div className="flex flex-col justify-center items-center h-96 bg-[#0B0B0B] rounded-2xl border border-white/10">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-white/15" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#E10600] animate-spin" />
          </div>
          <p className="text-sm font-medium text-white/70">{t("loading")}...</p>
        </div>
      );
    }

    if (customerError || articleError) {
      return (
        <div className="flex flex-col justify-center items-center h-96 bg-[#0B0B0B] rounded-2xl border border-white/10 p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-white font-semibold">{t("errorLoadingData")}</p>
          <p className="text-white/60 text-sm mt-2">
            {t("tryAgainLater") || "Probá de nuevo en unos minutos."}
          </p>
        </div>
      );
    }

    if (!resolvedArticle) {
      return (
        <div className="flex flex-col justify-center items-center h-96 bg-[#0B0B0B] rounded-2xl border border-white/10 p-8">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-white/70 font-medium">{t("noArticleSelected")}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6 items-stretch p-4">
        {/* Card del artículo */}
        <div className="w-full lg:max-w-md xl:max-w-lg rounded-2xl overflow-hidden bg-white/5 backdrop-blur border border-white/10 shadow-2xl flex flex-col relative">
          {/* Header con iconos y tag */}
          <div className="relative">
            <div className="absolute top-3 left-3 right-3 z-30 flex justify-between items-start">
              <div className="flex-shrink-0">
                <StripeStock articleId={resolvedArticle.id} />
              </div>

              <div className="flex items-center gap-1">
                <ArticleMenu
                  onAddToFavourites={toggleFavourite}
                  isFavourite={!!isFavourite}
                  article={resolvedArticle}
                />
              </div>
            </div>

            {resolvedArticle.tag && (
              <div className="absolute top-10 left-3 z-20">
                <Tag tag={resolvedArticle.tag} />
              </div>
            )}

            {/* Imagen */}
            <div className="pt-12 px-4 pb-4">
              <div className="h-56 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl">
                <ArticleImage img={resolvedArticle.images || [""]} />
              </div>
            </div>
          </div>

          {/* Información del producto */}
          <div className="px-6 pb-4 space-y-4 flex-1 flex flex-col justify-between text-white">
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
                  <div className="border-t border-white/10" />
                </>
              )}

              <SuggestedPrice
                article={resolvedArticle}
                showPurchasePrice={showPurchasePrice}
              />
            </div>
          </div>

          {/* Sección de agregar al carrito */}
          <div className="p-6 bg-white/5 border-t border-white/10">
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

          {/* Acento marca */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E10600] opacity-90" />
        </div>

        {/* Descripción */}
        <div className="flex-1 rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-2xl p-6 text-white">
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
      className="z-50 min-h-[400px] max-h-[90vh] overflow-y-auto hide-scrollbar bg-[#0B0B0B] rounded-xl border border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header del modal */}
      <div className="flex justify-between items-center sticky top-0 z-40 p-4 pb-4 border-b border-white/10 bg-[#0B0B0B]">
        <h2 className="text-xl font-extrabold text-white">
          {t("articleDetails")}
          <span className="text-[#E10600]">.</span>
        </h2>

        <button
          onClick={closeModal}
          aria-label={t("close")}
          className="
          h-9 w-9 rounded-full flex justify-center items-center
          bg-white/5 border border-white/10
          text-white
          transition-all
          hover:bg-[#E10600] hover:border-[#E10600]
          shadow-lg
        "
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
