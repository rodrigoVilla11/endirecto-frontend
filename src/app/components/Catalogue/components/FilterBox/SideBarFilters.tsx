"use client";
import React from "react";
import { useFilters } from "@/app/context/FiltersContext";
import { useTranslation } from "react-i18next";
import Brands from "../FilterBox/components/Brands";
import Items from "../FilterBox/components/Items";

const SidebarFilters = () => {
  const { t } = useTranslation();
  const {
    setOrder,
    order,
    setShowPurchasePrice,
    showPurchasePrice,
    setBrand,
    brand,
    setItem,
    item,
    setTags,
    tags,
  } = useFilters();

  // Botones de etiquetas
  const tagButtons = [
    { label: "OFERTAS", color: "bg-red-500" },
    { label: "NUEVO", color: "bg-green-500" },
    { label: "PROMOS", color: "bg-yellow-500" },
    { label: "KITS", color: "bg-orange-500" },
  ];

  const handleTagClick = (tag: string) => {
    if (tags === tag) {
      setTags("");
    } else {
      setTags(tag);
    }
  };

  return (
    <div className="w-full md:w-80 h-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl shadow-xl p-4 space-y-4 max-h-full overflow-y-auto">
      {/* Ordenar por */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase">
          ORDENAR POR
        </label>
        <select
          onChange={(e) => setOrder(e.target.value)}
          value={order}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Más vendidos</option>
          <option value="price:asc">Precio: Menor a mayor</option>
          <option value="price:desc">Precio: Mayor a menor</option>
          <option value="name:asc">Nombre: A-Z</option>
        </select>
      </div>

      {/* Precio de compra */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase">
          PRECIO DE COMPRA
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPurchasePrice(true)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              showPurchasePrice
                ? "bg-gray-600 text-white"
                : "bg-white border border-gray-300 text-gray-700"
            }`}
          >
            Mostrar
          </button>
          <button
            onClick={() => setShowPurchasePrice(false)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              !showPurchasePrice
                ? "bg-gray-600 text-white"
                : "bg-white border border-gray-300 text-gray-700"
            }`}
          >
            Ocultar
          </button>
        </div>
      </div>

      {/* Marcas */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase">
          {t("brands")}
        </label>
        <Brands onChange={setBrand} brand={brand} />
      </div>

      {/* Categoría */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase">
          {t("items")}
        </label>
        <Items onChange={setItem} item={item} />
      </div>

      {/* Etiquetas */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase">
          ETIQUETAS
        </label>
        <div className="flex flex-col gap-2">
          {tagButtons.map((tag, index) => (
            <button
              key={index}
              onClick={() => handleTagClick(tag.label)}
              className={`w-full py-4 rounded-lg text-sm font-bold text-white uppercase transition-all ${
                tags === tag.label
                  ? `${tag.color} shadow-lg scale-105`
                  : `${tag.color} opacity-90 hover:opacity-100`
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SidebarFilters;
