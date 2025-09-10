"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useGetCustomerByIdQuery,
  InstanceType,
  PriorityInstance,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import { IoMdClose } from "react-icons/io";
import { useClient } from "@/app/context/ClientContext";
import { useTranslation } from "react-i18next";

const MAX_NOTES = 500;
const TYPE_I18N_KEYS: Record<InstanceType, string> = {
  [InstanceType.COLLECTION_CALL]: "collectionCall",
  [InstanceType.WHATSAPP_MESSAGE]: "whatsappMessage",
  [InstanceType.SEND_ACCOUNT_SUMMARY]: "sendAccountSummary",
  [InstanceType.PAYMENT_CLAIM]: "paymentClaim",
};

const PRIORITY_I18N_KEYS: Record<PriorityInstance, string> = {
  [PriorityInstance.LOW]: "low",
  [PriorityInstance.MEDIUM]: "medium",
  [PriorityInstance.HIGH]: "high",
};

type CreateInstanceComponentProps = { closeModal: () => void };

const CreateInstanceComponent: React.FC<CreateInstanceComponentProps> = ({
  closeModal,
}) => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();

  const {
    data: customer,
    isLoading,
    error,
  } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  const [updateCustomer, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCustomerMutation();

  const [form, setForm] = useState({
    type: InstanceType.WHATSAPP_MESSAGE as InstanceType,
    priority: PriorityInstance.MEDIUM as PriorityInstance,
    notes: "",
  });

  const [errors, setErrors] = useState<{ notes?: string }>({});

  const firstFieldRef = useRef<HTMLSelectElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Focus inicial
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  const typeOptions = useMemo(
    () => Object.values(InstanceType) as InstanceType[],
    []
  );
  const priorityOptions = useMemo(
    () => Object.values(PriorityInstance) as PriorityInstance[],
    []
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value as any }));
    if (name === "notes") {
      if (!value.trim())
        setErrors((p) => ({ ...p, notes: t("validation.required") as string }));
      else if (value.length > MAX_NOTES)
        setErrors((p) => ({
          ...p,
          notes: t("validation.maxChars", { max: MAX_NOTES }) as string,
        }));
      else setErrors((p) => ({ ...p, notes: undefined }));
    }
  };

  const canSubmit = useMemo(() => {
    if (isUpdating) return false;
    if (!form.notes.trim()) return false;
    if (form.notes.length > MAX_NOTES) return false;
    return true;
  }, [form.notes, isUpdating]);

  const handleKeyDownForm = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Enter para enviar si no estamos en textarea
    const target = e.target as HTMLElement;
    if (e.key === "Enter" && target.tagName !== "TEXTAREA") {
      e.preventDefault();
      if (canSubmit) void handleSubmit(e as any);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === dialogRef.current) closeModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación mínima
    const errs: typeof errors = {};
    if (!form.notes.trim()) errs.notes = t("validation.required") as string;
    if (form.notes.length > MAX_NOTES)
      errs.notes = t("validation.maxChars", { max: MAX_NOTES }) as string;

    setErrors(errs);
    if (Object.keys(errs).length) return;

    const currentInstances = Array.isArray(customer?.instance)
      ? customer!.instance
      : [];

    const newInstance = {
      type: form.type,
      priority: form.priority,
      notes: form.notes.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      await updateCustomer({
        id: selectedClientId || "",
        instance: [...currentInstances, newInstance],
      }).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("errorCreatingInstance"), err);
    }
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-3"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={t("newInstance") as string}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">{t("newInstance")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-200 hover:bg-gray-300 rounded-full h-8 w-8 inline-flex items-center justify-center"
            aria-label={t("close") as string}
            type="button"
          >
            <IoMdClose className="text-base" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDownForm}
          className="px-4 py-4 space-y-4"
        >
          {/* Info de carga/error del cliente */}
          {isLoading && (
            <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-600">
              {t("loading")}…
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {t("errorLoading")}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-xs font-medium text-gray-700"
              >
                {t("type")}
              </label>
              <select
                id="type"
                name="type"
                ref={firstFieldRef}
                value={form.type}
                onChange={handleChange}
                className="mt-1 h-9 w-full rounded-md border px-2 text-sm outline-none focus:ring-2"
              >
                {typeOptions.map((opt) => {
                  const key =
                    TYPE_I18N_KEYS[opt] ??
                    String(opt).toLowerCase().replace(/\s+/g, "_");
                  return (
                    <option key={opt} value={opt}>
                      {t(`instanceType.${key}`, String(opt))}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="priority"
                className="block text-xs font-medium text-gray-700"
              >
                {t("priority")}
              </label>
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="mt-1 h-9 w-full rounded-md border px-2 text-sm outline-none focus:ring-2"
              >
                {priorityOptions.map((opt) => {
                  const key =
                    PRIORITY_I18N_KEYS[opt] ?? String(opt).toLowerCase();
                  return (
                    <option key={opt} value={opt}>
                      {t(`priority.${key}`, String(opt))}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label
                htmlFor="notes"
                className="block text-xs font-medium text-gray-700"
              >
                {t("notes")}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={form.notes}
                onChange={handleChange}
                maxLength={MAX_NOTES + 1} // para bloquear en 501 y mostrar error
                className={`mt-1 w-full rounded-md border px-2 py-2 text-sm outline-none focus:ring-2 ${
                  errors.notes ? "border-red-300 ring-red-200" : ""
                }`}
                placeholder={t("notesPlaceholder") as string}
              />
              <div className="mt-1 flex items-center justify-between text-xs">
                <span
                  className={errors.notes ? "text-red-600" : "text-gray-500"}
                >
                  {errors.notes ? errors.notes : t("writeSomethingHelpful")}
                </span>
                <span
                  className={`tabular-nums ${
                    form.notes.length > MAX_NOTES
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {form.notes.length}/{MAX_NOTES}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`rounded-md px-3 py-2 text-sm font-medium text-white ${
                canSubmit
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isUpdating ? t("saving") : t("save")}
            </button>
          </div>

          {/* Feedback inline (opcional si no cerrás al éxito) */}
          {!isUpdating && isSuccess && (
            <p className="mt-2 text-xs text-green-600">
              {t("instanceCreatedSuccess")}
            </p>
          )}
          {!isUpdating && isError && (
            <p className="mt-2 text-xs text-red-600">
              {t("errorCreatingInstance")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateInstanceComponent;
