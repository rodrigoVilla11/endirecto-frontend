import { useGetArticleByIdQuery } from "@/redux/services/articlesApi";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";

const Tag = ({ articleId }: { articleId: string }) => {
  const encodedId = encodeURIComponent(articleId);

  // Obtener el artículo por ID
  const { data, error, isLoading } = useGetArticleByIdQuery({
    id: encodedId,
  });

  // Obtener el marketing con filtro
  const filterBy = "tags";
  const { data: marketing } = useGetMarketingByFilterQuery({ filterBy });

  // Extraer el tag del artículo
  const tag = data?.tag;

  // Buscar coincidencia en los objetos dentro de marketing
  const matchingTag = marketing?.find(
    (item: any) => item.tags?.name === tag
  );

  // Extraer la imagen de la etiqueta coincidente
  const matchingImage = matchingTag?.tags?.image || null;

  // Renderizado condicional
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading data</p>;

  return (
    <div>
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
