import React from "react";
import { useArticleComparation } from "@/app/context/ComparationArticles";
import { X } from "lucide-react";
import CostPrice from "../CostPrice";
import SuggestedPrice from "../SuggestedPrice";
import StripeStock from "../StripeStock";
import TechnicalDetails from "../TechnicalDetails";

type ArticlesComparationProps = {
  closeModal: () => void;
};

const ArticlesComparation = ({ closeModal }: ArticlesComparationProps) => {
  const { articleIds } = useArticleComparation();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-black">
      <div className="bg-white rounded-lg w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-100 rounded-t-lg">
          <h2 className="text-lg font-medium">Comparador</h2>
          <button
            onClick={closeModal}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto p-4">
          <table className="table-auto w-full border-collapse border border-gray-300 text-sm text-center">
            {/* Table Head */}
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border border-gray-300">Categoría</th>
                {articleIds.map((product: any) => (
                  <th key={product.id} className="p-2 border border-gray-300">
                    Producto {product.id}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {/* Imagen */}
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Imagen
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <div className="h-16 w-12 mx-auto">
                      <img
                        src={product.images ? product.images[0] : ""}
                        alt={`Product ${product.id}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </td>
                ))}
              </tr>

              {/* ID */}
              <tr>
                <td className="p-2 border border-gray-300 font-medium">ID</td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    {product.id}
                  </td>
                ))}
              </tr>

              {/* Precio de Costo */}
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  P. COSTO S/IVA
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <CostPrice articleId={product.id} onlyPrice={true} />
                  </td>
                ))}
              </tr>

              {/* Precio Sugerido */}
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  P. PÚBLICO SUGERIDO
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <SuggestedPrice articleId={product.id} onlyPrice={true} />
                  </td>
                ))}
              </tr>

              {/* Stock */}
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Stock
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <StripeStock articleId={product.id} />
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-2 border border-gray-300 font-medium">Tipo</td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={1}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Viscosidad
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={2}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Norma
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={3}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">Uso</td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={4}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Grado
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={5}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">Tipo</td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={6}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Garantía Meses
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={7}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Borne
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={8}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  C20 A/H
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={9}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  RC (MIN)
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={10}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  C.C.A. SAE - 18°C
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={11}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Largo
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={12}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Ancho
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={13}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">Alto</td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={14}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Tensión Normal
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={15}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">AH</td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={16}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Tipo de Filtro
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={17}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Diámetro
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={18}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Altura
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={19}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Medida de Rosca
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={20}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Diámetro 2
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={21}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Diámetro Junta Tórica
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={22}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Par Apriete
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={23}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Nº Art. Herramienta Recomendada
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={24}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Peso Neto
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={25}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Peso Bruto
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={26}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Dimensiones
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={27}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Refrigerante
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={28}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Clasificación IP
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={29}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Temperatura de Trabajo
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={30}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Conector
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={31}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Tamaño Conector
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={32}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Energía
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={33}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">Fase</td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={34}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Frecuencia
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={35}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Alimentación
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={36}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Corriente
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={37}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Conexión
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={38}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Rango Temperatura
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={39}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Tipo de Aplicación
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={40}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Consumo
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={41}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Salida
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={42}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Protección
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={43}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Material
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={44}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Aislamiento
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={45}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Norma Aprobada
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={46}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Tensión
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={47}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Voltaje
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={48}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 font-medium">
                  Consumo de Corriente
                </td>
                {articleIds.map((product: any) => (
                  <td key={product.id} className="p-2 border border-gray-300">
                    <TechnicalDetails
                      articleId={product.id}
                      technicalDetailId={49}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ArticlesComparation;
