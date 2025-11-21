"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import Modal from "@/app/components/components/Modal";
import CreateInstanceComponent from "./CreateInstance";
import Instance from "./Instance";
import { FaCalendar } from "react-icons/fa";

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
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

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

    // Filtrar por búsqueda
    if (q) {
      list = list.filter((it) => {
        const text =
          `${it?.title ?? ""} ${it?.description ?? ""} ${it?.status ?? ""}`
            .toString()
            .toLowerCase();
        return text.includes(q);
      });
    }

    // Filtrar por tipo
    if (filterType !== "all") {
      list = list.filter((it) => it?.type === filterType);
    }

    // Filtrar por prioridad
    if (filterPriority !== "all") {
      list = list.filter((it) => it?.priority === filterPriority);
    }

    // Ordenar
    list = [...list].sort((a, b) => {
      if (sortKey === "created_at") {
        const da = new Date(a?.created_at ?? a?.createdAt ?? 0).getTime();
        const db = new Date(b?.created_at ?? b?.createdAt ?? 0).getTime();
        return db - da;
      }
      const av = (a?.[sortKey] ?? "").toString().toLowerCase();
      const bv = (b?.[sortKey] ?? "").toString().toLowerCase();
      return av.localeCompare(bv);
    });

    return list;
  }, [instances, query, sortKey, filterType, filterPriority]);

  return (
    <section className="h-[90vh] flex flex-col rounded-3xl overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-[3px] shadow-2xl">
      <div className="bg-zinc-950 rounded-3xl h-full flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">{customer?.id || ''}</p>
              <h2 className="text-2xl font-bold text-white">
                CRM - {customer?.name || 'Cobranza'}
              </h2>
            </div>
            <button
              onClick={closeModal}
              className="bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 flex justify-center items-center transition-colors"
              aria-label={t("close")}
            >
              <IoMdClose className="text-xl text-white" />
            </button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={openCreateModal}
              className="bg-white text-gray-900 rounded-xl px-4 py-3 text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              Nueva instancia
            </button>

            <div className="relative">
              <input
                type="date"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Fecha"
              />
              <FaCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tipo</option>
              <option value="llamada">Llamada</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="visita">Visita</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Prioridad</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar">
          {/* Loading */}
          {isLoading && (
            <ul className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="animate-pulse">
                  <div className="h-32 rounded-2xl bg-gray-800" />
                </li>
              ))}
            </ul>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-6">
              <p className="text-sm text-red-400">
                {t("errorLoading")}{" "}
                <button
                  onClick={() => refetch()}
                  className="underline font-medium hover:text-red-300"
                >
                  {t("retry")}
                </button>
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-700 p-12 text-center">
              <div className="text-6xl">📋</div>
              <p className="text-sm text-gray-400">
                {query
                  ? t("noResultsForQuery", { query })
                  : t("noInstancesAvailable")}
              </p>
              <div className="flex items-center gap-3">
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-sm text-gray-400 hover:text-white underline"
                  >
                    {t("clearSearch")}
                  </button>
                )}
                <button
                  onClick={openCreateModal}
                  className="text-sm rounded-xl bg-white px-4 py-2 text-gray-900 font-bold hover:bg-gray-100"
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
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateInstanceComponent closeModal={closeCreateModal} />
      </Modal>
    </section>
  );
};

export default CRM;