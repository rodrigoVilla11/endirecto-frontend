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
    if (!navigator.geolocation) return console.error("Geolocation not supported");
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
          setForm((prev) => ({ ...prev, gps: gpsStr, insitu: response.insitu }));
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
      <div className="h-full flex flex-col bg-zinc-900 max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white">←</button>
            <h2 className="text-xl font-semibold text-white">{t("visitModal.headerTitle")}</h2>
          </div>
          <button className="text-white">ℹ️</button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="border-b border-zinc-800">
            <InfoRow label={t("visitModal.info.date")} value={currentDateTime} />
            <InfoRow
              label={<div className="flex items-center gap-2" onClick={handleGetLocation}>{t("visitModal.info.gps")} 🌐</div>}
              value={
                insitu === null
                  ? <span className="text-gray-500">{t("visitModal.info.waitingLocation")}</span>
                  : insitu
                    ? <span className="text-green-500">{t("visitModal.info.insitu")}</span>
                    : <span className="text-red-500">{t("visitModal.info.notInsitu")}</span>
              }
            />
          </div>
          <div className="border-b border-zinc-800">
            <button onClick={() => setShowPredefinedComments((v) => !v)} className="w-full p-4 flex justify-between items-center text-white">
              <span>{t("visitModal.predefinedComments")}</span>
              <span>{showPredefinedComments ? "▼" : "▶"}</span>
            </button>
            {showPredefinedComments && data?.map((item) => (
              <div key={item.id} className="p-4 bg-zinc-800" onClick={() => setObservations(item.name)}>
                <p className="text-zinc-400">{item.name}</p>
              </div>
            ))}
          </div>
          <div className="p-4">
            <label className="block text-white mb-2">{t("visitModal.observations.label")}</label>
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
            ref={submitBtnRef} onClick={handleSubmit}
            disabled={isButtonDisabled}
            className={`w-full py-3 rounded-md font-medium transition-colors duration-300 ${
              isButtonDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white pointer-events-auto"
            }`}
          >
            {isSubmitting
              ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t("visitModal.loading")}</span>
              : submitted
                ? <span className="text-green-300 font-bold text-lg">✓</span>
                : t("visitModal.send")
            }
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
