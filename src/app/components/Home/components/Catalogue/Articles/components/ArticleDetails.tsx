import React from "react";
import { X, Package, Tag, Info } from "lucide-react";
import ArticleMenu from "./ArticleMenu";
import ArticleImage from "./ArticleImage";
import ArticleName from "./ArticleName";
import Description from "./Description/Description";

const ArticleDetails = ({ closeModal, article }: any) => {
 return (
  <div className="bg-[#0B0B0B] rounded-3xl overflow-hidden max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar border border-white/10 shadow-2xl">
    {/* Header */}
    <div className="bg-[#0B0B0B] p-6 flex justify-between items-center sticky top-0 z-10 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#E10600]/10 border border-[#E10600]/25 rounded-xl">
          <Package className="w-6 h-6 text-[#E10600]" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">
          Detalles del Producto<span className="text-[#E10600]">.</span>
        </h2>
      </div>

      <button
        onClick={closeModal}
        className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2 transition-all"
        aria-label="Cerrar"
      >
        <X className="w-6 h-6" />
      </button>
    </div>

    {/* Contenido principal */}
    <div className="p-6 bg-[#0B0B0B]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 backdrop-blur rounded-3xl border border-white/10 shadow-xl overflow-hidden sticky top-24">
            {/* Menu acciones */}
            <div className="p-4 bg-white/5 border-b border-white/10">
              <ArticleMenu article={article} />
            </div>

            {/* Imagen */}
            <div className="aspect-square bg-white/5 p-6">
              <ArticleImage img={article.images} />
            </div>

            {/* Nombre + info */}
            <div className="p-6 bg-transparent border-t border-white/10">
              <ArticleName name={article.name} id={article.id} />

              {/* Código */}
              <div className="mt-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-white/60" />
                <span className="text-sm font-semibold text-white/70">
                  Código:
                </span>
                <span className="text-sm font-extrabold text-white bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
                  {article.id}
                </span>
              </div>

              {/* Precio */}
              {article.price && (
                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">
                      ${article.price.toLocaleString("es-AR")}
                    </span>
                    {article.originalPrice && (
                      <span className="text-sm text-white/40 line-through">
                        ${article.originalPrice.toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>

                  {article.discount && (
                    <div className="mt-2">
                      <span className="text-xs font-extrabold text-white bg-[#E10600] px-2 py-1 rounded-full">
                        {article.discount}% OFF
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Stock */}
              {article.stock !== undefined && (
                <div className="mt-4">
                  {article.stock > 0 ? (
                    <div className="flex items-center gap-2 text-white bg-white/5 border border-white/10 px-3 py-2 rounded-2xl">
                      <div className="w-2 h-2 bg-[#E10600] rounded-full animate-pulse" />
                      <span className="text-sm font-extrabold">
                        {article.stock > 10
                          ? "En Stock"
                          : `Últimas ${article.stock} unidades`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-white/80 bg-white/5 border border-white/10 px-3 py-2 rounded-2xl">
                      <div className="w-2 h-2 bg-white/40 rounded-full" />
                      <span className="text-sm font-extrabold">Sin Stock</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 backdrop-blur rounded-3xl border border-white/10 shadow-xl p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
              <Info className="w-6 h-6 text-[#E10600]" />
              <h3 className="text-xl font-extrabold text-white">
                Información del Producto
              </h3>
            </div>

            <Description article={article} description={article.description} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

};

export default ArticleDetails;