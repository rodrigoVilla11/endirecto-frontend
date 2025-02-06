import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";

const Tag = ({ tag }: { tag: string }) => {

  // Obtener el marketing con filtro
  const filterBy = "tags";
  const { data: marketing } = useGetMarketingByFilterQuery({ filterBy });

  // Buscar coincidencia en los objetos dentro de marketing
  const matchingTag = marketing?.find(
    (item: any) => item.tags?.name === tag
  );
  // Extraer la imagen de la etiqueta coincidente
  const matchingImage = matchingTag?.tags?.image || null;

  return (
    <div className="z-30">
      {matchingImage && (
        <img
          src={matchingImage}
          alt={tag}
          className="h-6 m-4"
        />
      ) }
    </div>
  );
};

export default Tag;
