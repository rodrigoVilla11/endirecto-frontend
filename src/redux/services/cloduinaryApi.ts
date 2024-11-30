import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const cloduinaryApi = createApi({
  reducerPath: "cloduinaryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000", // Valor predeterminado si la variable de entorno no está disponible
  }),
  endpoints: (builder) => ({
    uploadImage: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "/cloudinary/upload",
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const { useUploadImageMutation } = cloduinaryApi;
