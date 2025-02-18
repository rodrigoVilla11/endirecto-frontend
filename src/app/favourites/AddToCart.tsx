"use client";
import { useUpdateCustomerMutation } from "@/redux/services/customersApi";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type AddToCartProps = {
  articleId: string;
  closeModal: () => void;
  customer: any;
};

const AddToCartComponent: React.FC<AddToCartProps> = ({
  articleId,
  closeModal,
  customer,
}) => {
  const { t } = useTranslation();

  const [quantity, setQuantity] = useState(1);
  const [decodedArticleId, setDecodedArticleId] = useState("");
  const [updateCustomer, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCustomerMutation();

  useEffect(() => {
    setDecodedArticleId(decodeURIComponent(articleId));
  }, [articleId]);

  const handleAddToCart = async () => {
    try {
      const updatedShoppingCart = [
        ...customer.shopping_cart,
        ...Array(quantity).fill(decodedArticleId),
      ];

      await updateCustomer({
        id: customer.id,
        shopping_cart: updatedShoppingCart,
      });

      closeModal();
    } catch (err) {
      console.error("Error adding Article to cart:", err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg mb-4">{t("addToCartPage.title")}</h2>
      <p>{t("addToCartPage.prompt")}</p>
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
        className="mt-2 p-2 border rounded w-full"
        min="1"
      />
      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-400 rounded-md p-2 text-white"
        >
          {t("addToCartPage.cancel")}
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          className={`rounded-md p-2 text-white ${
            isUpdating ? "bg-gray-500" : "bg-green-600"
          }`}
          disabled={isUpdating}
        >
          {isUpdating ? t("addToCartPage.adding") : t("addToCartPage.add")}
        </button>
      </div>
      {isSuccess && (
        <p className="text-green-500 mt-2">{t("addToCartPage.success")}</p>
      )}
      {isError && (
        <p className="text-red-500 mt-2">{t("addToCartPage.error")}</p>
      )}
    </div>
  );
};

export default AddToCartComponent;
