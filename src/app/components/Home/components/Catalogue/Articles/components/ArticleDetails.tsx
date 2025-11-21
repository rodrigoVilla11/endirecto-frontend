import React from "react";
import { X, Package, Tag, Info } from "lucide-react";
import ArticleMenu from "./ArticleMenu";
import ArticleImage from "./ArticleImage";
import ArticleName from "./ArticleName";
import Description from "./Description/Description";

const ArticleDetails = ({ closeModal, article }: any) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-red-500 via-white to-blue-500 p-6 flex justify-between items-center sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Detalles del Producto
          </h2>
        </div>
        <button
          onClick={closeModal}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Contenido principal */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Imagen y info básica */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden sticky top-24">
              {/* Menu de acciones */}
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <ArticleMenu article={article} />
              </div>

              {/* Imagen del producto */}
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                <ArticleImage img={article.images} />
              </div>

              {/* Nombre del producto */}
              <div className="p-6 bg-white border-t-2 border-gray-200">
                <ArticleName name={article.name} id={article.id} />
                
                {/* Código del producto */}
                <div className="mt-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">
                    Código:
                  </span>
                  <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                    {article.id}
                  </span>
                </div>

                {/* Precio (si existe) */}
                {article.price && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-red-500 via-white to-blue-500 bg-clip-text text-transparent">
                        ${article.price.toLocaleString('es-AR')}
                      </span>
                      {article.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          ${article.originalPrice.toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                    {article.discount && (
                      <div className="mt-2">
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
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
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border-2 border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold">
                          {article.stock > 10 ? 'En Stock' : `Últimas ${article.stock} unidades`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border-2 border-red-200">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-bold">Sin Stock</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho - Descripción y detalles */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-gray-200">
                <Info className="w-6 h-6 text-purple-500" />
                <h3 className="text-xl font-bold text-gray-900">
                  Información del Producto
                </h3>
              </div>
              
              <Description article={article} description={article.description} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ec4899, #a855f7, #3b82f6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #db2777, #9333ea, #2563eb);
        }
      `}</style>
    </div>
  );
};

export default ArticleDetails;