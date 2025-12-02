"use client";
import React from "react";
import { FaTrashCan } from "react-icons/fa6";
import { useFilters } from "@/app/context/FiltersContext";
import { useTranslation } from "react-i18next";
import Brands from "../FilterBox/components/Brands";
import Items from "../FilterBox/components/Items";
import { useGetBrandByIdQuery } from "@/redux/services/brandsApi";
import { useGetItemByIdQuery } from "@/redux/services/itemsApi";

const SidebarFilters = () => {
  const { t } = useTranslation();
  const {
    // orden
    setOrder,
    order,
    // precio de compra
    setShowPurchasePrice,
    showPurchasePrice,
    // marca / item
    setBrand,
    brand,
    setItem,
    item,
    // tags
    setTags,
    tags,
    // búsqueda (si la usás en el contexto)
    setSearch,
    search,
  } = useFilters();

  // Nombre de marca / rubro desde la API (igual que en FilterBox)
  const { data: dataBrand } = useGetBrandByIdQuery(
    { id: brand },
    { skip: !brand }
  );
  const { data: dataItem } = useGetItemByIdQuery(
    { id: item },
    { skip: !item }
  );

  // Botones de etiquetas (tu diseño original)
  const tagButtons = [
    { label: "OFERTAS", color: "bg-red-500", id: "OFFER" },
    { label: "NUEVO", color: "bg-green-500", id: "NEW" },
    { label: "PROMOS", color: "bg-yellow-500" , id: "OUTLET"},
    { label: "KITS", color: "bg-orange-500", id: "COMBO" },
  ];

  const handleTagClick = (tag: string) => {
    if (tags === tag) {
      setTags("");
    } else {
      setTags(tag);
    }
  };

  const hasAppliedFilters = Boolean(
    (tags && tags.length > 0) ||
      (brand && brand !== "") ||
      (item && item !== "") ||
      (search && search !== "")
  );

  return (
    <div className="w-full md:w-80 h-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl shadow-xl p-4 space-y-4 max-h-full overflow-y-auto">
      {/* Filtros aplicados (como en FilterBox) */}
      {hasAppliedFilters && (
        <div className="mb-2">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">
            {t("filtersApplied") || "Filtros aplicados"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags && tags.length > 0 && (
              <div className="bg-gray-100 rounded-full py-1 px-3 text-xs flex items-center">
                {tags}
                <button
                  className="ml-2 text-red-500 opacity-90 hover:opacity-100"
                  onClick={() => setTags("")}
                >
                  <FaTrashCan className="w-3 h-3" />
                </button>
              </div>
            )}

            {search && search !== "" && (
              <div className="bg-gray-100 rounded-full py-1 px-3 text-xs flex items-center">
                {search}
                <button
                  className="ml-2 text-red-500 opacity-90 hover:opacity-100"
                  onClick={() => setSearch("")}
                >
                  <FaTrashCan className="w-3 h-3" />
                </button>
              </div>
            )}

            {brand && brand !== "" && (
              <div className="bg-gray-100 rounded-full py-1 px-3 text-xs flex items-center">
                {dataBrand?.name || brand}
                <button
                  className="ml-2 text-red-500 opacity-90 hover:opacity-100"
                  onClick={() => setBrand("")}
                >
                  <FaTrashCan className="w-3 h-3" />
                </button>
              </div>
            )}

            {item && item !== "" && (
              <div className="bg-gray-100 rounded-full py-1 px-3 text-xs flex items-center">
                {dataItem?.name || item}
                <button
                  className="ml-2 text-red-500 opacity-90 hover:opacity-100"
                  onClick={() => setItem("")}
                >
                  <FaTrashCan className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ordenar por */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase">
          {"ORDENAR POR"}
        </label>
        <select
          onChange={(e) => setOrder(e.target.value)}
          value={order}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">{t("bestSellers") || "Más vendidos"}</option>
          <option value="price:asc">
            {"Precio: Menor a mayor"}
          </option>
          <option value="price:desc">
            { "Precio: Mayor a menor"}
          </option>
          <option value="name:asc">
            {"Nombre: A-Z"}
          </option>
        </select>
      </div>

      {/* Precio de compra */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase">
          {"PRECIO DE COMPRA"}
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
            {t("show") || "Mostrar"}
          </button>
          <button
            onClick={() => setShowPurchasePrice(false)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              !showPurchasePrice
                ? "bg-gray-600 text-white"
                : "bg-white border border-gray-300 text-gray-700"
            }`}
          >
            {t("hide") || "Ocultar"}
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

      {/* Categoría / Item */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase">
          {t("items")}
        </label>
        <Items onChange={setItem} item={item} />
      </div>

      {/* Etiquetas (misma UI que tenías) */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase">
          ETIQUETAS
        </label>
        <div className="flex flex-col gap-2">
          {tagButtons.map((tag, index) => (
            <button
              key={index}
              onClick={() => handleTagClick(tag.id)}
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
