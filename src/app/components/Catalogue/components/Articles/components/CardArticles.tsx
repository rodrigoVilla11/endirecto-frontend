"use client"

import { useEffect, useState } from "react"
import StripeStock from "./StripeStock"
import ArticleName from "./ArticleName"
import ArticleImage from "./ArticleImage"
import ArticleMenu from "./ArticleMenu"
import CostPrice from "./CostPrice"
import SuggestedPrice from "./SuggestedPrice"
import AddToCart from "./AddToCart"
import Modal from "@/app/components/components/Modal"
import { useClient } from "@/app/context/ClientContext"
import { useGetCustomerByIdQuery, useUpdateCustomerMutation } from "@/redux/services/customersApi"
import ArticleDetails from "./ArticleDetails"
import { useArticleId } from "@/app/context/AritlceIdContext"
import Tag from "@/app/components/Home/components/Catalogue/Articles/components/Tag"

interface FormState {
  id: string
  favourites: string[]
  shopping_cart: string[]
}

const CardArticles = ({ article, showPurchasePrice }: any) => {
  // Keeping all the existing state and hooks
  const [isModalOpen, setModalOpen] = useState(false)
  const { selectedClientId } = useClient()
  const [quantity, setQuantity] = useState(1)
  const { articleId, setArticleId } = useArticleId()

  const {
    data: customer,
    error,
    isLoading,
    refetch,
  } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  })

  const [updateCustomer] = useUpdateCustomerMutation()
  const [form, setForm] = useState<FormState>({
    id: "",
    favourites: [],
    shopping_cart: [],
  })

  // Keeping all the existing useEffects and functions
  useEffect(() => {
    if (customer) {
      setForm({
        id: customer.id || "",
        favourites: customer.favourites || [],
        shopping_cart: customer.shopping_cart || [],
      })
    }
  }, [customer])

  const toggleFavourite = () => {
    setForm((prev) => {
      const isFavourite = prev.favourites.includes(article.id)
      const updatedFavourites = isFavourite
        ? prev.favourites.filter((id) => id !== article.id)
        : [...prev.favourites, article.id]

      updateCustomer({ id: form.id, favourites: updatedFavourites }).then(() => {
        refetch()
      })

      return {
        ...prev,
        favourites: updatedFavourites,
      }
    })
  }

  const toggleShoppingCart = () => {
    setForm((prev) => {
      const newShoppingCart = [...prev.shopping_cart]
      for (let i = 0; i < quantity; i++) {
        newShoppingCart.push(article.id)
      }

      updateCustomer({ id: form.id, shopping_cart: newShoppingCart }).then(() => {
        refetch()
      })

      return {
        ...prev,
        shopping_cart: newShoppingCart,
      }
    })
  }

  const isFavourite = form.favourites.includes(article.id)
  const closeModal = () => setModalOpen(false)
  const handleOpenModal = (id: string) => {
    setModalOpen(true)
    setArticleId(id)
  }

  return (
    <div>
      <div className="relative flex flex-col bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 w-36 sm:w-52">
        {/* Menu Icons */}
        <div className="absolute top-2 right-2 z-30">
          <ArticleMenu onAddToFavourites={toggleFavourite} isFavourite={isFavourite} article={article} />
        </div>

        {/* Main Content */}
        <div onClick={() => handleOpenModal(article.id)} className="cursor-pointer">
          {/* Tag and Image Section */}
          <div className="relative">
          <div className="absolute w-full h-full flex justify-start items-start z-20 opacity-75">
              <Tag tag={article.tag} />
            </div>
            <div className="aspect-square w-full">
              <ArticleImage img={article.images} />
            </div>
            <StripeStock articleId={article.id} />
          </div>

          {/* Product Info Section */}
          <div className="p-3 bg-gray-50">
            <ArticleName name={article.name} id={article.id} code={article.supplier_code} />
            {showPurchasePrice && (
              <>
                <CostPrice article={article} selectedClientId={selectedClientId} />
                <div className="my-2 border-t border-gray-200" />
              </>
            )}
            <SuggestedPrice article={article} showPurchasePrice={showPurchasePrice} />
          </div>
        </div>

        {/* Add to Cart Section */}
        <div className="p-3 border-t border-gray-100">
          <AddToCart
            articleId={article.id}
            onAddToCart={toggleShoppingCart}
            quantity={quantity}
            setQuantity={setQuantity}
          />
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ArticleDetails closeModal={closeModal} />
      </Modal>
    </div>
  )
}

export default CardArticles

