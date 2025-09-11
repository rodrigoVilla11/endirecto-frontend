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

  const currentDateTime = new Date().toISOString();
  const { selectedClientId } = useClient();
  const { userData } = useAuth();

  const [gps, setGPS] = useState("");
  const [insitu, setInsitu] = useState<boolean | null>(null);

  // ✅ NUEVO: hojas seleccionadas obligatorias
  const [selectedLeafs, setSelectedLeafs] = useState<string[]>([]);
  const selectedText = selectedLeafs.join(" | ");

  // Observación libre (opcional)
  const [observations, setObservations] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);

  // ✅ Botón deshabilitado si NO hay hojas
  const isButtonDisabled = isSubmitting || selectedLeafs.length === 0;

  // NUEVO
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [permState, setPermState] = useState<
    "granted" | "prompt" | "denied" | "unsupported" | null
  >(null);
  const didAutoLocateRef = useRef(false);

  const retryAskLocation = () => {
    if (permState === "denied") {
      setLocError(
        "El permiso de ubicación está bloqueado para este sitio. Habilitalo en Configuración del sitio y reintentá."
      );
      return;
    }
    handleGetLocation();
  };

  const [form, setForm] = useState({
    date: currentDateTime,
    type: ActionType.VISIT,
    status: StatusType.SENDED,
    notes: "",
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
    if (!navigator.geolocation) {
      setLocError("Geolocalización no soportada");
      return;
    }

    setIsLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const gpsStr = `${latitude}, ${longitude}`;
          setGPS(gpsStr);

          if (!selectedClientId) {
            setLocError("No hay cliente seleccionado");
            setIsLocating(false);
            return;
          }

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
          setLocError("No se pudo validar la ubicación");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error(err);
        // Podés mapear códigos si querés más detalle
        // err.code === 1: PERMISSION_DENIED, 2: POSITION_UNAVAILABLE, 3: TIMEOUT
        setLocError(
          err.code === 1
            ? "Permiso de ubicación denegado"
            : err.code === 3
            ? "Tiempo de espera agotado"
            : "No se pudo obtener tu ubicación"
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10s
        maximumAge: 10000, // cache hasta 10s
      }
    );
  };

  useEffect(() => {
    if (!isOpen) {
      didAutoLocateRef.current = false;
      return;
    }

    const hasPermissionsAPI =
      typeof navigator !== "undefined" &&
      "permissions" in navigator &&
      // @ts-ignore
      typeof navigator.permissions?.query === "function";

    if (hasPermissionsAPI) {
      // @ts-ignore
      navigator.permissions
        .query({ name: "geolocation" })
        .then((p: any) => {
          setPermState(p.state as any);

          // si no está denegado, intentamos automáticamente 1 vez
          if (!didAutoLocateRef.current && p.state !== "denied") {
            didAutoLocateRef.current = true;
            handleGetLocation();
          }

          p.onchange = () => setPermState(p.state as any);
        })
        .catch(() => {
          setPermState("unsupported");
          if (!didAutoLocateRef.current) {
            didAutoLocateRef.current = true;
            handleGetLocation();
          }
        });
    } else {
      setPermState("unsupported");
      if (!didAutoLocateRef.current) {
        didAutoLocateRef.current = true;
        handleGetLocation();
      }
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (selectedLeafs.length === 0) return; // doble check

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitted(false);
    try {
      // Construimos notes: hojas + (opcional) observación libre
      const notes = observations.trim()
        ? `${selectedText} | Obs: ${observations.trim()}`
        : selectedText;

      await createCrm({ ...form, notes }).unwrap();
      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        onClose();
        submittingRef.current = false;
        setIsSubmitting(false);
        // reset local (opcional)
        setSelectedLeafs([]);
        setObservations("");
        setInsitu(null);
        setGPS("");
      }, 800);
    } catch (err) {
      console.error(err);
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
        {/* Header */}
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
          {/* Info */}
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
                isLocating ? (
                  <span className="flex items-center gap-2 text-zinc-300">
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t("visitModal.info.waitingLocation") ||
                      "Obteniendo ubicación..."}
                  </span>
                ) : locError ? (
                  <span className="flex items-center gap-2">
                    <span className="text-red-500">{locError}</span>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="text-xs px-2 py-0.5 rounded bg-zinc-200 text-zinc-900 hover:bg-white"
                    >
                      Reintentar
                    </button>
                  </span>
                ) : insitu === null ? (
                  <span className="text-gray-500">
                    {t("visitModal.info.waitingLocation")}
                  </span>
                ) : insitu ? (
                  <span className="text-green-500">
                    {t("visitModal.info.insitu")}
                    {gps && (
                      <span className="ml-2 text-xs text-zinc-400">{gps}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-red-500">
                    {t("visitModal.info.notInsitu")}
                    {gps && (
                      <span className="ml-2 text-xs text-zinc-400">{gps}</span>
                    )}
                  </span>
                )
              }
            />
          </div>

          {/* ✅ Comentarios predefinidos SIEMPRE visibles y obligatorios */}
          <div className="border-b border-zinc-800">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2">
              <span className="text-white font-medium">
                {t("filterByComments") || "Comentarios predefinidos"}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedLeafs.length
                    ? "bg-emerald-200 text-emerald-900"
                    : "bg-red-200 text-red-900"
                }`}
              >
                {selectedLeafs.length
                  ? `${selectedLeafs.length} seleccionados`
                  : "min. 1 requerido"}
              </span>
            </div>
            <div className="px-4 pb-3">
              <PredefinedCommentsTreeFilter
                selectedLeafs={selectedLeafs}
                onChange={setSelectedLeafs} // recibe SOLO hojas
              />
            </div>
          </div>

          {/* Observación libre (opcional) */}
          <div className="p-4">
            <label className="block text-white mb-2">
              {t("visitModal.observations.label") || "Observación (opcional)"}
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full h-32 p-3 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:border-blue-500 resize-none"
              placeholder={
                t("visitModal.observations.placeholder") ||
                "Agregar detalle opcional…"
              }
            />
            {selectedLeafs.length === 0 && (
              <p className="mt-2 text-xs text-red-400">
                Debés seleccionar al menos un comentario.
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="relative group">
          <button
            ref={submitBtnRef}
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className={`w-full py-3 rounded-md font-medium transition-colors duration-300 ${
              isButtonDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
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
          {selectedLeafs.length === 0 && !isSubmitting && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              Seleccioná al menos un comentario
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

/* ===================== ÁRBOL DE COMENTARIOS (solo hojas) ===================== */

type Node = { label: string; children?: Node[] };

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

function gatherLeafPaths(node: Node, prefix = ""): string[] {
  const path = prefix ? `${prefix} > ${node.label}` : node.label;
  if (!node.children?.length) return [path];
  return node.children.flatMap((c) => gatherLeafPaths(c, path));
}
function gatherAllPaths(node: Node, prefix = ""): string[] {
  const path = prefix ? `${prefix} > ${node.label}` : node.label;
  if (!node.children?.length) return [path];
  return [path, ...node.children.flatMap((c) => gatherAllPaths(c, path))];
}
function computeTriState(node: Node, checked: Set<string>, prefix = "") {
  const leafs = gatherLeafPaths(node, prefix);
  const selected = leafs.filter((p) => checked.has(p)).length;
  const all = leafs.length;
  return {
    checked: all > 0 && selected === all,
    indeterminate: selected > 0 && selected < all,
  };
}

function PredefinedCommentsTreeFilter({
  selectedLeafs,
  onChange,
}: {
  selectedLeafs: string[];
  onChange: (leafs: string[]) => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedLeafs));
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({}); // colapsado por defecto

  // abrir ramas con selección inicial (solo una vez)
  useEffect(() => {
    const next: Record<string, boolean> = {};
    const mark = (n: Node, prefix = "") => {
      const path = prefix ? `${prefix} > ${n.label}` : n.label;
      const hasSelected = gatherAllPaths(n, prefix).some((p) =>
        selectedLeafs.includes(p)
      );
      if (hasSelected) next[path] = true;
      n.children?.forEach((c) => mark(c, path));
    };
    PREDEFINED_TREE.forEach((n) => mark(n));
    setOpenMap((prev) => ({ ...prev, ...next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sincronizar si cambian desde afuera
  useEffect(() => {
    const curr = Array.from(checked).sort();
    const next = [...selectedLeafs].sort();
    if (curr.length !== next.length || curr.some((v, i) => v !== next[i])) {
      setChecked(new Set(selectedLeafs));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeafs]);

  // emitir SOLO hojas
  useEffect(() => {
    const leafsOnly = Array.from(checked).filter(
      (path) =>
        !Array.from(checked).some(
          (o) => o !== path && o.startsWith(path + " > ")
        )
    );
    onChange(leafsOnly);
  }, [checked, onChange]);

  const toggleNode = (node: Node, prefix = "") => {
    const leafs = gatherLeafPaths(node, prefix);
    setChecked((prev) => {
      const next = new Set(prev);
      const anySelected = leafs.some((p) => next.has(p));
      if (anySelected) leafs.forEach((p) => next.delete(p));
      else leafs.forEach((p) => next.add(p));
      return next;
    });
  };

  const expandAll = () => {
    const map: Record<string, boolean> = {};
    const walk = (n: Node, prefix = "") => {
      const path = prefix ? `${prefix} > ${n.label}` : n.label;
      map[path] = true;
      n.children?.forEach((c) => walk(c, path));
    };
    PREDEFINED_TREE.forEach((n) => walk(n));
    setOpenMap(map);
  };
  const collapseAll = () => setOpenMap({});
  const clear = () => setChecked(new Set());

  return (
    <div className="rounded-md bg-zinc-900/40">
      <div className="flex items-center gap-2 py-2">
        <button
          onClick={expandAll}
          className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
        >
          Expandir todo
        </button>
        <button
          onClick={collapseAll}
          className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
        >
          Contraer todo
        </button>
        <button
          onClick={clear}
          className="ml-auto text-xs px-2 py-1 rounded bg-red-600/80 text-white hover:bg-red-600"
        >
          Limpiar selección
        </button>
      </div>

      <div className="space-y-1">
        {PREDEFINED_TREE.map((node) => (
          <TreeNodeUI
            key={node.label}
            node={node}
            prefix=""
            openMap={openMap}
            setOpenMap={setOpenMap}
            checked={checked}
            onToggle={toggleNode}
          />
        ))}
      </div>
    </div>
  );
}

function TreeNodeUI({
  node,
  prefix,
  openMap,
  setOpenMap,
  checked,
  onToggle,
}: {
  node: Node;
  prefix: string;
  openMap: Record<string, boolean>;
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  checked: Set<string>;
  onToggle: (node: Node, prefix?: string) => void;
}) {
  const path = prefix ? `${prefix} > ${node.label}` : node.label;
  const hasChildren = !!node.children?.length;
  const { checked: isChecked, indeterminate } = computeTriState(
    node,
    checked,
    prefix
  );
  const isOpen = !!openMap[path];

  const cbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (cbRef.current)
      cbRef.current.indeterminate = indeterminate && !isChecked;
  }, [indeterminate, isChecked]);

  return (
    <div className="pl-1">
      <div className="group flex items-center gap-2 py-1 pr-2 rounded hover:bg-zinc-800/60">
        {hasChildren ? (
          <button
            type="button"
            aria-label={isOpen ? "Contraer" : "Expandir"}
            onClick={() => setOpenMap((m) => ({ ...m, [path]: !isOpen }))}
            className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <span
              className={`inline-block transform transition-transform ${
                isOpen ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
          </button>
        ) : (
          <span className="w-5" />
        )}

        <input
          ref={cbRef}
          id={path}
          type="checkbox"
          className="accent-blue-500"
          checked={isChecked}
          onChange={() => onToggle(node, prefix)}
          title={node.label}
        />
        <label
          htmlFor={path}
          className="cursor-pointer select-none text-sm text-zinc-200"
        >
          {node.label}
        </label>
      </div>

      {hasChildren && (
        <div
          className={`ml-6 border-l border-zinc-700/60 pl-3 overflow-hidden transition-all duration-200 ${
            isOpen ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {node.children!.map((child) => (
            <TreeNodeUI
              key={child.label}
              node={child}
              prefix={path}
              openMap={openMap}
              setOpenMap={setOpenMap}
              checked={checked}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
