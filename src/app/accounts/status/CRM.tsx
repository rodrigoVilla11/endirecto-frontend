"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import Modal from "@/app/components/components/Modal";
import CreateInstanceComponent from "./CreateInstance";
import Instance from "./Instance";

interface CRMProps {
  selectedClientId: any;
  closeModal: () => void;
}

type SortKey = "created_at" | "title" | "status";

const CRM: React.FC<CRMProps> = ({ selectedClientId, closeModal }) => {
  const { t } = useTranslation();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");

  const {
    data: customer,
    error,
    isLoading,
    refetch,
    isFetching,
  } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  const instances: any[] = Array.isArray(customer?.instance)
    ? customer!.instance
    : [];

  const openCreateModal = useCallback(() => setCreateModalOpen(true), []);
  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    refetch();
  }, [refetch]);

  // Atajos de teclado: "n" = nueva instancia, "Esc" = cerrar modal CRM
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "n") openCreateModal();
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCreateModal, closeModal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = instances;

    if (q) {
      list = list.filter((it) => {
        const text =
          `${it?.title ?? ""} ${it?.description ?? ""} ${it?.status ?? ""}`
            .toString()
            .toLowerCase();
        return text.includes(q);
      });
    }

    list = [...list].sort((a, b) => {
      if (sortKey === "created_at") {
        const da = new Date(a?.created_at ?? a?.createdAt ?? 0).getTime();
        const db = new Date(b?.created_at ?? b?.createdAt ?? 0).getTime();
        return db - da; // más nuevo primero
      }
      const av = (a?.[sortKey] ?? "").toString().toLowerCase();
      const bv = (b?.[sortKey] ?? "").toString().toLowerCase();
      return av.localeCompare(bv);
    });

    return list;
  }, [instances, query, sortKey]);

  return (
    <section className="m-5 rounded-2xl border border-gray-200 shadow-sm">
      {/* Header */}
      <header className="flex items-center gap-2 justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base">{t("crm")}</h3>
          <span
            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-600"
            aria-label={t("itemsCount")}
            title={t("itemsCount") as string}
          >
            {isLoading ? "…" : instances.length}
          </span>
          {isFetching && (
            <span className="text-xs text-gray-400">{t("updating")}…</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search") as string}
              className="h-8 w-48 rounded-md border px-2 text-sm outline-none focus:ring-2"
              aria-label={t("search") as string}
            />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-8 rounded-md border px-2 text-sm"
              aria-label={t("sortBy") as string}
            >
              <option value="created_at">{t("sort.createdAt")}</option>
              <option value="title">{t("sort.title")}</option>
              <option value="status">{t("sort.status")}</option>
            </select>
          </div>

          <button
            className="bg-black text-white rounded-md px-3 py-1 text-sm hover:opacity-90 active:opacity-80"
            onClick={openCreateModal}
            aria-label={t("newInstance") as string}
          >
            {t("newInstance")}
          </button>

          <button
            onClick={closeModal}
            className="bg-gray-200 hover:bg-gray-300 rounded-full h-8 w-8 flex justify-center items-center"
            aria-label={t("close")}
            title={t("close") as string}
          >
            <IoMdClose className="text-base" />
          </button>
        </div>
      </header>

      {/* Toolbar (mobile) */}
      <div className="md:hidden flex gap-2 px-4 pt-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search") as string}
          className="h-9 flex-1 rounded-md border px-3 text-sm outline-none focus:ring-2"
          aria-label={t("search") as string}
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="h-9 rounded-md border px-2 text-sm"
          aria-label={t("sortBy") as string}
        >
          <option value="created_at">{t("sort.createdAt")}</option>
          <option value="title">{t("sort.title")}</option>
          <option value="status">{t("sort.status")}</option>
        </select>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {/* Loading */}
        {isLoading && (
          <ul className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="animate-pulse">
                <div className="h-16 rounded-xl bg-gray-100" />
              </li>
            ))}
          </ul>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm text-red-700">
              {t("errorLoading")}{" "}
              <button
                onClick={() => refetch()}
                className="underline font-medium"
              >
                {t("retry")}
              </button>
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
            <div className="h-10 w-10 rounded-full bg-gray-100" />
            <p className="text-sm text-gray-600">
              {query
                ? t("noResultsForQuery", { query })
                : t("noInstancesAvailable")}
            </p>
            <div className="flex items-center gap-2">
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-sm underline"
                >
                  {t("clearSearch")}
                </button>
              )}
              <button
                onClick={openCreateModal}
                className="text-sm rounded-md bg-black px-3 py-1 text-white"
              >
                {t("newInstance")}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {!isLoading && !error && filtered.length > 0 && (
          <ul className="space-y-3">
            {filtered.map((item: any, index: number) => (
              <li key={item?.id ?? item?._id ?? index}>
                <Instance instances={item} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateInstanceComponent closeModal={closeCreateModal} />
      </Modal>
    </section>
  );
};

export default CRM;
