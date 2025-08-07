"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaPlus, FaTimes, FaEdit } from "react-icons/fa";
import { AiFillFileExcel } from "react-icons/ai";
import { IoSync } from "react-icons/io5";
import {
  useGetArticlesEquivalencesQuery,
  useUpdateArticleEquivalenceMutation,
} from "@/redux/services/articlesEquivalences";
import {
  useGetAllArticlesQuery,
  useSyncEquivalencesMutation,
} from "@/redux/services/articlesApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import Modal from "@/app/components/components/Modal";
import CreateArticlesEquivalencesModal from "./CreateEquivalence";
import ImportExcelModal from "../application-of-articles/ImportExcel";
import ExportExcelModal from "../application-of-articles/ExportExcelButton";
import { useTranslation } from "react-i18next";
import { IoMdClose } from "react-icons/io";
import ExportArticlesEquivalencesModal from "./ExportExcel";

const ITEMS_PER_PAGE = 15;

const Page = () => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [equivalences, setEquivalences] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedEquivalence, setSelectedEquivalence] = useState<any>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data: articlesData } = useGetAllArticlesQuery(null);

  const {
    data,
    isLoading: isQueryLoading,
    refetch,
  } = useGetArticlesEquivalencesQuery(
    { page, limit: ITEMS_PER_PAGE, query: searchQuery },
    { refetchOnMountOrArgChange: true }
  );

  const [syncEquivalences, { isLoading: isSyncing }] =
    useSyncEquivalencesMutation();
  const [updateArticleEquivalence] = useUpdateArticleEquivalenceMutation();

  const handleSync = async () => {
    if (isSyncing) return; // evita doble click
    try {
      await syncEquivalences().unwrap();
      // opcional: algún toast de éxito
    } catch (e) {
      // opcional: toast de error
    }
  };

  useEffect(() => {
    if (!data?.equivalences) return;
    if (page === 1) {
      setEquivalences(data.equivalences);
    } else {
      const newItems = data.equivalences.filter(
        (eq) => !equivalences.some((item) => item.id === eq.id)
      );
      setEquivalences((prev) => [...prev, ...newItems]);
    }
    setHasMore(data.equivalences.length === ITEMS_PER_PAGE);
  }, [data?.equivalences, page]);

  useEffect(() => {
    // Cada vez que cambia la query de búsqueda, reiniciamos el paginado
    setPage(1);
    setEquivalences([]);
  }, [searchQuery]);

  const lastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isQueryLoading) {
            setPage((prev) => prev + 1);
          }
        },
        { rootMargin: "200px" }
      );
      if (node) observerRef.current.observe(node);
    },
    [hasMore, isQueryLoading]
  );

  const tableData = equivalences.map((item) => {
    const article = articlesData?.find(
      (a) => a.id.trim().toLowerCase() === item.article_id.trim().toLowerCase()
    );
    return {
      key: `${item.article_id}-${item.brand}-${item.code}`,
      article: article?.supplier_code || t("notFound"),
      brand: item?.brand || t("notFound"),
      code: item?.code || t("notFound"),
      actions: (
        <button
          onClick={() => handleEdit(item)}
          className="text-blue-500 hover:text-blue-700"
        >
          <FaEdit />
        </button>
      ),
    };
  });

  const handleEdit = (item: any) => {
    setSelectedEquivalence(item);
    setEditModalOpen(true);
  };

  const handleUpdate = async (data: any) => {
    await updateArticleEquivalence(data);
    refetch();
    setEditModalOpen(false);
  };

  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: t("new"),
        onClick: () => setCreateModalOpen(true),
      },
      {
        logo: <AiFillFileExcel />,
        title: t("importExcel"),
        onClick: () => setImportModalOpen(true),
      },
      {
        logo: <AiFillFileExcel />,
        title: t("exportExcel"),
        onClick: () => setExportModalOpen(true),
      },
      {
        logo: <IoSync className={isSyncing ? "animate-spin" : ""} />,
        title: isSyncing ? t("Sincronizando") : t("syncEquivalences"),
        onClick: handleSync,
      },
    ],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  // Solo actualizamos el estado del searchQuery (ya reinicia page automáticamente)
                  setSearchQuery(e.currentTarget.value);
                }
              }}
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                  setEquivalences([]);
                }}
              >
                <FaTimes />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: t("results", { count: data?.total || 0 }),
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold pt-4 px-4">{t("articlesEquivalences")}</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={[
            { name: t("article"), key: "article" },
            { name: t("brand"), key: "brand" },
            { name: t("code"), key: "code" },
            { name: t("actions"), key: "actions" },
          ]}
          data={tableData}
        />
        <div ref={lastRef} className="h-10" />
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
        >
          <CreateArticlesEquivalencesModal
            closeModal={() => setCreateModalOpen(false)}
          />
        </Modal>
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setImportModalOpen(false)}
        >
          <ImportExcelModal closeModal={() => setImportModalOpen(false)} />
        </Modal>
        <Modal
          isOpen={isExportModalOpen}
          onClose={() => setExportModalOpen(false)}
        >
          <ExportArticlesEquivalencesModal
            closeModal={() => setExportModalOpen(false)}
            searchQuery={searchQuery}
          />
        </Modal>
        <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
          <EditArticleEquivalenceComponent
            equivalence={selectedEquivalence}
            onUpdate={handleUpdate}
            onCancel={() => setEditModalOpen(false)}
          />
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;

const EditArticleEquivalenceComponent = ({
  equivalence,
  onUpdate,
  onCancel,
}: any) => {
  const [formData, setFormData] = useState({
    brand: equivalence?.brand || "",
    code: equivalence?.code || "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onUpdate({ id: equivalence.id, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold mb-4">Editar Equivalencia</h2>
        <button
          onClick={onCancel}
          className="absolute top-1 right-1 bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
        >
          <IoMdClose className="text-sm" />
        </button>
      </div>
      <div className="mb-2">
        <label className="block mb-1">Marca:</label>
        <input
          type="text"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          className="w-full border p-1"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Código:</label>
        <input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          className="w-full border p-1"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Actualizar
      </button>
    </form>
  );
};
