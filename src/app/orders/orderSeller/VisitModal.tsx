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

  const handleRemoveSelectedLeaf = (path: string) => {
    setSelectedLeafs((prev) => prev.filter((p) => p !== path));
  };

  if (!isOpen) return null;

return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50" onClick={onClose}>
      <div
        className="h-full flex flex-col bg-zinc-900 max-w-4xl mx-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors text-2xl"
            >
              ←
            </button>
            <h2 className="text-2xl font-bold text-white">
              {t("visitModal.headerTitle")}
            </h2>
          </div>
          <button className="text-3xl">ℹ️</button>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Info */}
          <div className="bg-zinc-800/50 border-b-2 border-zinc-700">
            <InfoRow
              label={t("visitModal.info.date")}
              value={currentDateTime}
            />
            <InfoRow
              label={
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={handleGetLocation}
                >
                  {t("visitModal.info.gps")} 🌐
                </div>
              }
              value={
                isLocating ? (
                  <span className="flex items-center gap-2 text-zinc-300">
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t("visitModal.info.waitingLocation") || "Obteniendo ubicación..."}
                  </span>
                ) : locError ? (
                  <span className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-red-400 font-semibold">{locError}</span>
                    <button
                      type="button"
                      onClick={retryAskLocation}
                      className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-bold"
                    >
                      Reintentar
                    </button>
                    {permState === "denied" && (
                      <details className="mt-2 sm:mt-0 sm:ml-2">
                        <summary className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer font-semibold">
                          ¿Cómo habilitar?
                        </summary>
                        <div className="mt-2 text-xs text-zinc-300 max-w-md bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                          <p className="mb-2">• <strong>Chrome (desktop):</strong> clic en el candado → Permisos del sitio → Ubicación → Permitir, y recargá la página.</p>
                          <p className="mb-2">• <strong>Android (Chrome):</strong> candado → Permisos → Ubicación → Permitir.</p>
                          <p>• <strong>iOS (Safari):</strong> Ajustes → Safari → Ubicación → Preguntar/Permitir; luego recargá.</p>
                        </div>
                      </details>
                    )}
                  </span>
                ) : insitu === null ? (
                  <span className="text-zinc-400 font-medium">
                    {t("visitModal.info.waitingLocation")}
                  </span>
                ) : insitu ? (
                  <span className="text-emerald-400 font-bold">
                    {t("visitModal.info.insitu")}
                    {gps && (
                      <span className="ml-2 text-xs text-zinc-500">{gps}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-red-400 font-bold">
                    {t("visitModal.info.notInsitu")}
                    {gps && (
                      <span className="ml-2 text-xs text-zinc-500">{gps}</span>
                    )}
                  </span>
                )
              }
            />
          </div>

          {/* Comentarios predefinidos */}
          <div className="border-b-2 border-zinc-700 bg-zinc-900">
            <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-white font-bold text-lg">
                💬 {t("filterByComments") || "Comentarios predefinidos"}
              </span>
              <span
                className={`inline-flex items-center text-xs px-3 py-1.5 rounded-full font-bold ${
                  selectedLeafs.length
                    ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50"
                    : "bg-red-500/20 text-red-400 border-2 border-red-500/50"
                }`}
              >
                {selectedLeafs.length
                  ? `✅ ${selectedLeafs.length} seleccionados`
                  : "⚠️ min. 1 requerido"}
              </span>
            </div>

            <div className="px-6 pb-6">
              <PredefinedCommentsTreeFilter
                selectedLeafs={selectedLeafs}
                onChange={setSelectedLeafs}
              />
            </div>

            {/* Listado de seleccionados */}
            {selectedLeafs.length > 0 && (
              <div className="px-6 pb-6 border-t-2 border-zinc-800">
                <p className="text-xs text-zinc-400 mb-3 font-semibold mt-4">📌 Seleccionados:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedLeafs.map((path) => (
                    <button
                      key={path}
                      type="button"
                      onClick={() => handleRemoveSelectedLeaf(path)}
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 border border-purple-400 transition-all font-medium"
                      title={path}
                    >
                      <span className="truncate max-w-[220px]">{path}</span>
                      <span className="text-red-300 hover:text-red-100 font-bold">
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Observación libre */}
          <div className="p-6 bg-zinc-900">
            <label className="block text-white font-bold mb-3 text-lg">
              📝 {t("visitModal.observations.label") || "Observación (opcional)"}
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full h-32 p-4 bg-zinc-800 text-white rounded-xl border-2 border-zinc-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 resize-none font-medium transition-all placeholder:text-zinc-500"
              placeholder={
                t("visitModal.observations.placeholder") ||
                "Agregar detalle opcional…"
              }
            />
            {selectedLeafs.length === 0 && (
              <p className="mt-3 text-sm text-red-400 font-semibold bg-red-500/20 p-3 rounded-lg border-2 border-red-500/50">
                ⚠️ Debés seleccionar al menos un comentario.
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="relative group p-6 border-t-2 border-zinc-700 bg-zinc-800/50">
          <button
            ref={submitBtnRef}
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
              isButtonDisabled
                ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white hover:shadow-xl"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("visitModal.loading")}
              </span>
            ) : submitted ? (
              <span className="text-white font-bold text-2xl">✓</span>
            ) : (
              `✅ ${t("visitModal.send")}`
            )}
          </button>
          {selectedLeafs.length === 0 && !isSubmitting && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-sm px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 font-medium border border-zinc-700">
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
    <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-zinc-700">
      <span className="text-zinc-400 font-semibold">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

/* ===================== ÁRBOL DE COMENTARIOS ===================== */

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

function PredefinedCommentsTreeFilter({
  selectedLeafs,
  onChange,
}: {
  selectedLeafs: string[];
  onChange: (leafs: string[]) => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedLeafs));
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    const curr = Array.from(checked).sort();
    const next = [...selectedLeafs].sort();
    if (curr.length !== next.length || curr.some((v, i) => v !== next[i])) {
      setChecked(new Set(selectedLeafs));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeafs]);

  const toggleLeaf = (path: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  useEffect(() => {
    const leafsOnly = Array.from(checked).filter(
      (path) =>
        !Array.from(checked).some(
          (o) => o !== path && o.startsWith(path + " > ")
        )
    );
    onChange(leafsOnly);
  }, [checked, onChange]);

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
    <div className="rounded-2xl bg-zinc-800/50 p-4 border-2 border-zinc-700">
      <div className="flex flex-wrap items-center gap-2 pb-4 border-b-2 border-zinc-700">
        <button
          onClick={expandAll}
          className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-bold transition-all"
        >
          ➕ Expandir todo
        </button>
        <button
          onClick={collapseAll}
          className="text-xs px-3 py-2 rounded-lg bg-zinc-600 text-white hover:bg-zinc-500 font-bold transition-all"
        >
          ➖ Contraer todo
        </button>
        <button
          onClick={clear}
          className="ml-auto text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 font-bold transition-all"
        >
          🗑️ Limpiar selección
        </button>
      </div>

      <div className="space-y-1 mt-4">
        {PREDEFINED_TREE.map((node) => (
          <TreeNodeUI
            key={node.label}
            node={node}
            prefix=""
            openMap={openMap}
            setOpenMap={setOpenMap}
            checked={checked}
            onToggleLeaf={toggleLeaf}
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
  onToggleLeaf,
}: {
  node: Node;
  prefix: string;
  openMap: Record<string, boolean>;
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  checked: Set<string>;
  onToggleLeaf: (path: string) => void;
}) {
  const path = prefix ? `${prefix} > ${node.label}` : node.label;
  const hasChildren = !!node.children?.length;
  const isOpen = !!openMap[path];
  const isChecked = checked.has(path);

  const cbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (cbRef.current) cbRef.current.indeterminate = false;
  }, [isChecked]);

  return (
    <div className="pl-1">
      <div className="group flex items-center gap-2 py-2 pr-2 rounded-lg hover:bg-zinc-700/50 transition-colors">
        {hasChildren ? (
          <button
            type="button"
            aria-label={isOpen ? "Contraer" : "Expandir"}
            onClick={() => setOpenMap((m) => ({ ...m, [path]: !isOpen }))}
            className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-purple-400 transition-colors"
          >
            <span
              className={`inline-block transform transition-transform font-bold ${
                isOpen ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {hasChildren ? (
          <button
            type="button"
            onClick={() =>
              setOpenMap((m) => ({
                ...m,
                [path]: !isOpen,
              }))
            }
            className="cursor-pointer select-none text-sm text-zinc-200 hover:text-purple-400 text-left flex-1 font-semibold transition-colors"
          >
            {node.label}
          </button>
        ) : (
          <>
            <input
              ref={cbRef}
              id={path}
              type="checkbox"
              className="w-4 h-4 rounded border-2 border-zinc-600 bg-zinc-700 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              checked={isChecked}
              onChange={() => onToggleLeaf(path)}
              title={node.label}
            />
            <label
              htmlFor={path}
              className="cursor-pointer select-none text-sm text-zinc-300 hover:text-purple-400 font-medium transition-colors"
            >
              {node.label}
            </label>
          </>
        )}
      </div>

      {hasChildren && (
        <div
          className={`ml-6 border-l-2 border-zinc-700 pl-3 overflow-hidden transition-all duration-200 ${
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
              onToggleLeaf={onToggleLeaf}
            />
          ))}
        </div>
      )}
    </div>
  );
}