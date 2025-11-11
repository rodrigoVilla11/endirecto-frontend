import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const cloduinaryApi = createApi({
  reducerPath: "cloduinaryApi",
  baseQuery: fetchBaseQuery({
    baseUrl:
      process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    // 📸 Subir imágenes (png, jpg, jpeg)
    uploadImage: builder.mutation({
      query: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "/cloudinary/upload",
          method: "POST",
          body: formData,
        };
      },
    }),

    // 📄 Subir PDFs
    uploadPdf: builder.mutation({
      query: (args: { file: File; folder?: string }) => {
        const formData = new FormData();
        formData.append("file", args.file);
        if (args.folder) formData.append("folder", args.folder);

        return {
          url: "/cloudinary/upload-pdf",
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

// Hooks generados automáticamente
export const { useUploadImageMutation, useUploadPdfMutation } = cloduinaryApi;
