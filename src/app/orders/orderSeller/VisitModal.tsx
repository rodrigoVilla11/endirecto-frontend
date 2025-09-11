"use client";
import {
  ActionType,
  StatusType,
  useCreateCrmMutation,
  useCheckInsituVisitMutation,
} from "@/redux/services/crmApi";
import { useEffect, useState, useRef } from "react";
import { useClient } from "@/app/context/ClientContext";
import { useAuth } from "@/app/context/AuthContext";
import { useGetCrmPrenotesQuery } from "@/redux/services/crmPrenotes";
import { useTranslation } from "react-i18next";

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VisitModal({ isOpen, onClose }: VisitModalProps) {
  const { t } = useTranslation();
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const [createCrm] = useCreateCrmMutation();
  const [insituVisit] = useCheckInsituVisitMutation();
  const { data } = useGetCrmPrenotesQuery(null);

  const currentDateTime = new Date().toISOString();
  const { selectedClientId } = useClient();
  const { userData } = useAuth();

  const [gps, setGPS] = useState("");
  const [insitu, setInsitu] = useState<boolean | null>(null);
  const [observations, setObservations] = useState("");
  const [showPredefinedComments, setShowPredefinedComments] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);

  const isButtonDisabled = isSubmitting || observations.trim() === "";

  const [form, setForm] = useState({
    date: currentDateTime,
    type: ActionType.VISIT,
    status: StatusType.SENDED,
    notes: observations,
    customer_id: selectedClientId || "",
    seller_id: userData?.seller_id || "",
    user_id: userData?._id || "",
    gps: "",
    insitu: false,
  });

  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({ ...prev, date: new Date().toISOString() }));
    }
  }, [isOpen]);

  const handleGetLocation = () => {
    if (!navigator.geolocation)
      return console.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const gpsStr = `${latitude}, ${longitude}`;
        setGPS(gpsStr);
        if (!selectedClientId) return console.error("No cliente seleccionado");
        try {
          const response = await insituVisit({
            customerId: selectedClientId,
            currentLat: latitude,
            currentLon: longitude,
          }).unwrap();
          setInsitu(response.insitu);
          setForm((prev) => ({
            ...prev,
            gps: gpsStr,
            insitu: response.insitu,
          }));
        } catch (err) {
          console.error(err);
        }
      },
      (err) => console.error(err)
    );
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitted(false);
    try {
      await createCrm({ ...form, notes: observations }).unwrap();
      setSubmitted(true);
      // Mantener el botón deshabilitado hasta cerrar modal
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        // Reset flags tras cerrar
        submittingRef.current = false;
        setIsSubmitting(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      // Rehabilitar en caso de error
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50" onClick={onClose}>
      <div
        className="h-full flex flex-col bg-zinc-900 max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white">
              ←
            </button>
            <h2 className="text-xl font-semibold text-white">
              {t("visitModal.headerTitle")}
            </h2>
          </div>
          <button className="text-white">ℹ️</button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="border-b border-zinc-800">
            <InfoRow
              label={t("visitModal.info.date")}
              value={currentDateTime}
            />
            <InfoRow
              label={
                <div
                  className="flex items-center gap-2"
                  onClick={handleGetLocation}
                >
                  {t("visitModal.info.gps")} 🌐
                </div>
              }
              value={
                insitu === null ? (
                  <span className="text-gray-500">
                    {t("visitModal.info.waitingLocation")}
                  </span>
                ) : insitu ? (
                  <span className="text-green-500">
                    {t("visitModal.info.insitu")}
                  </span>
                ) : (
                  <span className="text-red-500">
                    {t("visitModal.info.notInsitu")}
                  </span>
                )
              }
            />
          </div>
          <div className="border-b border-zinc-800">
            <button
              onClick={() => setShowPredefinedComments((v) => !v)}
              className="w-full p-4 flex justify-between items-center text-white"
            >
              <span>{t("visitModal.predefinedComments")}</span>
              <span>{showPredefinedComments ? "▼" : "▶"}</span>
            </button>

            {showPredefinedComments && (
              <div className="p-2">
                <PredefinedCommentsTree
                  selected={observations}
                  onChange={(newText) => setObservations(newText)}
                />
              </div>
            )}
          </div>
          <div className="p-4">
            <label className="block text-white mb-2">
              {t("visitModal.observations.label")}
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full h-32 p-3 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:border-blue-500 resize-none"
              placeholder={t("visitModal.observations.placeholder")}
            />
          </div>
        </div>
        <div className="relative group">
          <button
            ref={submitBtnRef}
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className={`w-full py-3 rounded-md font-medium transition-colors duration-300 ${
              isButtonDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white pointer-events-auto"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("visitModal.loading")}
              </span>
            ) : submitted ? (
              <span className="text-green-300 font-bold text-lg">✓</span>
            ) : (
              t("visitModal.send")
            )}
          </button>
          {observations.trim() === "" && !isSubmitting && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              {t("visitModal.tooltipObservationRequired")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="p-4 flex justify-between items-center border-b border-zinc-800">
      <span className="text-zinc-400">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

type Node = {
  label: string;
  children?: Node[];
};

// Árbol completo con las 4 categorías y subopciones
const PREDEFINED_TREE: Node[] = [
  {
    label: "Venta realizada",
    children: [
      { label: "Lubricantes" },
      { label: "Filtros" },
      { label: "Cubiertas" },
      { label: "Baterías" },
      { label: "Autopartes" },
      { label: "Aditivos" },
    ],
  },
  {
    label: "No venta",
    children: [
      {
        label: "Lubricantes",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Total" },
              { label: "ELF" },
              { label: "YPF" },
              { label: "Shell" },
              { label: "Castrol" },
              { label: "Motul" },
              { label: "Petronas" },
              { label: "Valvoline" },
              { label: "Gulf" },
              { label: "Otro" },
            ],
          },
        ],
      },
      {
        label: "Filtros",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Mahle" },
              { label: "Fram" },
              { label: "Maan" },
              { label: "Wega" },
              { label: "Bosch" },
              { label: "Acdelco" },
              { label: "WIX" },
              { label: "Otro" },
            ],
          },
        ],
      },
      {
        label: "Cubiertas",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Dunlop" },
              { label: "Corven" },
              { label: "Chaoyang" },
              { label: "Pirelli" },
              { label: "Fate" },
              { label: "Firestone" },
              { label: "Goodyear" },
              { label: "Michelin" },
              { label: "Otro" },
            ],
          },
        ],
      },
      {
        label: "Baterías",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Moura" },
              { label: "Willard" },
              { label: "Bosch" },
              { label: "Heliar" },
              { label: "Prestolite" },
              { label: "Varta" },
              { label: "Otro" },
            ],
          },
        ],
      },
      {
        label: "Autopartes",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Corven" },
              { label: "Nakata" },
              { label: "SKF" },
              { label: "Monroe" },
              { label: "Sachs" },
              { label: "Sadar" },
              { label: "Fric Rot" },
              { label: "Otro" },
            ],
          },
        ],
      },
      {
        label: "Aditivos",
        children: [
          { label: "Cliente no interesado" },
          { label: "Decisión postergada" },
          {
            label: "Competencia",
            children: [
              { label: "Liqui Moly" },
              { label: "Molykote" },
              { label: "Ceramo" },
              { label: "Mannol" },
              { label: "Bardahl" },
              { label: "Wynn´s" },
              { label: "STP" },
              { label: "Otro" },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Cobranza",
    children: [
      { label: "Cobro total" },
      { label: "Cobro parcial" },
      { label: "Cliente incobrable" },
    ],
  },
  {
    label: "Prospección / Cliente nuevo",
    children: [
      { label: "Se pudo dar de alta" },
      { label: "Hubo interés" },
      { label: "Se hizo alguna venta inicial" },
    ],
  },
];

// Convierte Set de rutas a string para observations
function selectedToText(s: Set<string>): string {
  const leafs = Array.from(s).filter((path) => {
    // si existe algún otro path en el set que empiece por este + " > ",
    // entonces este es un padre, no lo guardamos
    return !Array.from(s).some(
      (other) => other !== path && other.startsWith(path + " > ")
    );
  });
  return leafs.join(" | ");
}

// Componente árbol con checkboxes
function PredefinedCommentsTree({
  selected,
  onChange,
}: {
  selected: string; // observations actual
  onChange: (text: string) => void;
}) {
  // Guardamos rutas seleccionadas como Set<string>
  const initial = new Set(
    (selected || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const [checked, setChecked] = useState<Set<string>>(initial);

  useEffect(() => {
    onChange(selectedToText(checked));
  }, [checked, onChange]);

  const toggle = (path: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {PREDEFINED_TREE.map((node) => (
        <TreeNode
          key={node.label}
          node={node}
          pathPrefix=""
          checked={checked}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  pathPrefix,
  checked,
  onToggle,
}: {
  node: Node;
  pathPrefix: string;
  checked: Set<string>;
  onToggle: (path: string) => void;
}) {
  const [open, setOpen] = useState(true); // abierto al abrir el modal
  const path = pathPrefix ? `${pathPrefix} > ${node.label}` : node.label;
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div className="ml-0">
      <div className="flex items-start gap-2 py-1">
        <input
          id={path}
          type="checkbox"
          className="mt-1 accent-blue-500"
          checked={checked.has(path)}
          onChange={() => onToggle(path)}
        />
        <label
          htmlFor={path}
          className="text-sm text-zinc-200 cursor-pointer select-none"
          onClick={(e) => {
            // evitar que click en label cambie el open de golpe si no tiene hijos
            if (!hasChildren) return;
          }}
        >
          {node.label}
        </label>
        {hasChildren && (
          <button
            type="button"
            className="ml-auto text-xs text-zinc-400 hover:text-white"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "−" : "+"}
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div className="ml-5 border-l border-zinc-700 pl-3">
          {node.children!.map((child) => (
            <TreeNode
              key={child.label}
              node={child}
              pathPrefix={path}
              checked={checked}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
