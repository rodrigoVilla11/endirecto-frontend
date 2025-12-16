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
  const { data: dataItem } = useGetItemByIdQuery({ id: item }, { skip: !item });

  // Botones de etiquetas (tu diseño original)
  const tagButtons = [
    { label: "OFERTAS", color: "bg-red-500", id: "OFFER" },
    { label: "NUEVO", color: "bg-green-500", id: "NEW" },
    { label: "PROMOS", color: "bg-yellow-500", id: "OUTLET" },
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
    <div
      className="
    w-full md:w-80 h-full
    bg-white/5 backdrop-blur-xl
    rounded-3xl shadow-2xl
    border border-white/10
    p-4 space-y-5
    max-h-full overflow-y-auto
  "
    >
      {/* Filtros aplicados */}
      {hasAppliedFilters && (
        <div className="mb-1">
          <h3 className="text-xs font-extrabold text-white/70 mb-2 uppercase tracking-wide">
            {t("filtersApplied") || "Filtros aplicados"}
          </h3>

          <div className="flex flex-wrap gap-2">
            {tags && tags.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-full py-1 px-3 text-xs text-white/80 flex items-center">
                {tags}
                <button
                  className="ml-2 text-[#E10600] opacity-90 hover:opacity-100"
                  onClick={() => setTags("")}
                >
                  <FaTrashCan className="w-3 h-3" />
                </button>
              </div>
            )}

            {search && search !== "" && (
              <div className="bg-white/5 border border-white/10 rounded-full py-1 px-3 text-xs text-white/80 flex items-center">
                {search}
                <button
                  className="ml-2 text-[#E10600] opacity-90 hover:opacity-100"
                  onClick={() => setSearch("")}
                >
                  <FaTrashCan className="w-3 h-3" />
                </button>
              </div>
            )}

            {brand && brand !== "" && (
              <div className="bg-white/5 border border-white/10 rounded-full py-1 px-3 text-xs text-white/80 flex items-center">
                {dataBrand?.name || brand}
                <button
                  className="ml-2 text-[#E10600] opacity-90 hover:opacity-100"
                  onClick={() => setBrand("")}
                >
                  <FaTrashCan className="w-3 h-3" />
                </button>
              </div>
            )}

            {item && item !== "" && (
              <div className="bg-white/5 border border-white/10 rounded-full py-1 px-3 text-xs text-white/80 flex items-center">
                {dataItem?.name || item}
                <button
                  className="ml-2 text-[#E10600] opacity-90 hover:opacity-100"
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
        <label className="text-sm font-extrabold text-white/70 uppercase tracking-wide">
          ORDENAR POR
        </label>

        <select
          onChange={(e) => setOrder(e.target.value)}
          value={order}
          className="
          w-full px-4 py-3 rounded-2xl
          border border-white/10
          bg-black/30 text-sm font-semibold text-white
          focus:outline-none focus:ring-2 focus:ring-[#E10600]/25
        "
        >
          <option value="">{t("bestSellers") || "Más vendidos"}</option>
          <option value="price:asc">Precio: Menor a mayor</option>
          <option value="price:desc">Precio: Mayor a menor</option>
          <option value="name:asc">Nombre: A-Z</option>
        </select>
      </div>

      {/* Precio de compra */}
      <div className="space-y-2">
        <label className="text-sm font-extrabold text-white/70 uppercase tracking-wide">
          PRECIO DE COMPRA
        </label>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPurchasePrice(true)}
            className={`
            flex-1 px-4 py-3 rounded-2xl text-sm font-extrabold transition-all
            border
            ${
              showPurchasePrice
                ? "bg-[#E10600] text-white border-[#E10600]/40"
                : "bg-white/5 text-white/80 border-white/10 hover:border-[#E10600]/40"
            }
          `}
          >
            {t("show") || "Mostrar"}
          </button>

          <button
            onClick={() => setShowPurchasePrice(false)}
            className={`
            flex-1 px-4 py-3 rounded-2xl text-sm font-extrabold transition-all
            border
            ${
              !showPurchasePrice
                ? "bg-[#E10600] text-white border-[#E10600]/40"
                : "bg-white/5 text-white/80 border-white/10 hover:border-[#E10600]/40"
            }
          `}
          >
            {t("hide") || "Ocultar"}
          </button>
        </div>
      </div>

      {/* Marcas */}
      <div className="space-y-2">
        <label className="text-sm font-extrabold text-white/70 uppercase tracking-wide">
          {t("brands")}
        </label>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <Brands onChange={setBrand} brand={brand} />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <label className="text-sm font-extrabold text-white/70 uppercase tracking-wide">
          {t("items")}
        </label>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <Items onChange={setItem} item={item} />
        </div>
      </div>

      {/* Etiquetas */}
      <div className="space-y-2">
        <label className="text-sm font-extrabold text-white/70 uppercase tracking-wide">
          ETIQUETAS
        </label>

        <div className="flex flex-col gap-2">
          {tagButtons.map((tag, index) => (
            <button
              key={index}
              onClick={() => handleTagClick(tag.id)}
              className={`
              w-full py-4 rounded-2xl text-sm font-extrabold text-white uppercase transition-all
              border border-white/10
              ${
                tags === tag.label
                  ? "scale-[1.02] shadow-xl"
                  : "opacity-90 hover:opacity-100"
              }
            `}
              style={{
                background: `linear-gradient(135deg, ${tag.color.replace(
                  "bg-",
                  ""
                )})`,
              }}
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
