import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";

const Tag = ({ tag }: { tag: string }) => {
  // Obtener el marketing con filtro
  const filterBy = "tags";
  const { data: marketing } = useGetMarketingByFilterQuery({ filterBy });

  // Buscar coincidencia en los objetos dentro de marketing
  const matchingTag = marketing?.find((item: any) => item.tags?.name === tag);
  // Extraer la imagen de la etiqueta coincidente
  const matchingImage = matchingTag?.tags?.image || null;

  return (
    <div className="z-30">
      {matchingImage && (
        <div
          className="
          inline-flex items-center justify-center
          m-3 p-1.5
          bg-white/5 backdrop-blur
          border border-white/10
          rounded-xl
        "
        >
          <img
            src={matchingImage}
            alt={tag}
            className="h-6 w-auto object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default Tag;
