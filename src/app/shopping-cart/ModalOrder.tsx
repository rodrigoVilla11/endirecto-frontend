"use client";
import React, { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";
import { CiGps } from "react-icons/ci";
import { useClient } from "../context/ClientContext";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import { useGetPaymentConditionByIdQuery } from "@/redux/services/paymentConditionsApi";
import { useGetCustomerTransportByCustomerIdQuery } from "@/redux/services/customersTransports";
import { useCreateOrderMutation } from "@/redux/services/ordersApi";
import {
  useCreateNotificationMutation,
  NotificationType,
} from "@/redux/services/notificationsApi";
import { ActionType, StatusType, useCheckInsituVisitMutation, useCreateCrmMutation } from "@/redux/services/crmApi";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { addMonths, format } from "date-fns";
import { useAddNotificationToUserMutation } from "@/redux/services/usersApi";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  percentage: number;
}

interface OrderConfirmationProps {
  total: number;
  totalFormatted: string;
  itemCount: number;
  onCancel: () => void;
  order: OrderItem[];
}

interface TransactionDetails {
  quantity: number;
  article: {
    id: string;
  };
  percentage_1: number;
  netprice: number;
  total: number;
  branch: {
    id: string;
  };
  id: string;
}

interface Transaction {
  status: string;
  customer: {
    id: string | null;
  };
  seller: {
    id: string | undefined;
  };
  payment_condition: {
    id: string | undefined;
    percentage: string | undefined;
  };
  transport: {
    id: string | undefined;
  };
  tmp_id: string;
  total: number;
  notes: string;
  date: string;
  created_at: string;
  details: TransactionDetails[];
  gps: string;
  insitu: boolean;
}

export default function OrderConfirmation({
  total,
  itemCount,
  onCancel,
  order,
  totalFormatted,
}: OrderConfirmationProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [createOrder, { isLoading: isLoadingCreate }] = useCreateOrderMutation();
  const [addNotificationToUser] = useAddNotificationToUserMutation();
  const [checkInsituVisit] = useCheckInsituVisitMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [createCrm] = useCreateCrmMutation();

  const { selectedClientId } = useClient();

  // Estados para GPS, insitu, tick de éxito y observaciones
  const [gps, setGPS] = useState("");
  const [insitu, setInsitu] = useState<boolean | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: customer } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const { data: customerTransport } = useGetCustomerTransportByCustomerIdQuery({
    id: selectedClientId || "",
  });
  const { data: paymentsConditionsData } = useGetPaymentConditionByIdQuery({
    id: customer?.payment_condition_id || "",
  });

  const [transaction, setTransaction] = useState<Transaction>({
    status: "sended",
    customer: { id: selectedClientId },
    seller: { id: customer?.seller_id },
    payment_condition: {
      id: customer?.payment_condition_id,
      percentage: paymentsConditionsData?.percentage,
    },
    transport: { id: customerTransport?.transport_id },
    tmp_id: crypto.randomUUID(),
    total: total,
    notes: observations,
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    details: [],
    gps: "",
    insitu: false,
  });

  useEffect(() => {
    if (order.length > 0) {
      const mappedDetails = order.map((item) => ({
        quantity: item.quantity,
        article: { id: item.id },
        percentage_1: item.percentage,
        netprice: item.price,
        total: item.quantity * item.price,
        branch: { id: "001" },
        id: item.id,
      }));
      setTransaction((prev) => ({
        ...prev,
        details: mappedDetails,
      }));
    }
  }, [order]);

  const handleObservationChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newNotes = e.target.value;
    setObservations(newNotes);
    setTransaction((prev) => ({ ...prev, notes: newNotes }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      console.error(t("orderConfirmation.geolocationNotSupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const gpsStr = `${latitude}, ${longitude}`;
        setGPS(gpsStr);
        if (!selectedClientId) {
          console.error(t("orderConfirmation.noCustomerSelected"));
          return;
        }
        try {
          const response = await checkInsituVisit({
            customerId: selectedClientId,
            currentLat: latitude,
            currentLon: longitude,
          }).unwrap();
          setInsitu(response.insitu);
          setTransaction((prev) => ({
            ...prev,
            gps: gpsStr,
            insitu: response.insitu,
          }));
        } catch (error) {
          console.error(t("orderConfirmation.errorCheckingInsitu"), error);
        }
      },
      (error) => {
        console.error(t("orderConfirmation.errorGettingLocation"), error);
      }
    );
  };

  function getLocalISOStringWithOffset(): string {
    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
    const offsetMinutes = pad(Math.abs(offset) % 60);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${sign}${offsetHours}:${offsetMinutes}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const updatedTransaction: Transaction = {
      ...transaction,
      date: getLocalISOStringWithOffset(),
      created_at: getLocalISOStringWithOffset(),
      notes: observations,
    };

    try {
      // 1. Crear el pedido
      const createdOrder = await createOrder(updatedTransaction).unwrap();

      // 2. Actualizar el carrito del cliente, si corresponde
      if (customer && customer.shopping_cart) {
        const transactionArticleIds = updatedTransaction.details.map(
          (detail) => detail.article.id
        );
        const updatedShoppingCart = customer.shopping_cart.filter(
          (item: string) => !transactionArticleIds.includes(item)
        );
        await updateCustomer({
          id: customer.id,
          shopping_cart: updatedShoppingCart,
        }).unwrap();
      }

      // 3. Calcular schedule_from y schedule_to para la notificación
      const now = new Date();
      const schedule_from = format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      const schedule_to = format(
        addMonths(now, 1),
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
      );

      // Generar una cadena con los artículos del pedido
      const articlesString = updatedTransaction.details
        .map((detail) => `Artículo ${detail.article.id} (x${detail.quantity})`)
        .join(", ");

      // Construir título y descripción para la notificación
      const notificationTitle = `Pedido Número ${createdOrder.tmp_id}, Cliente ${selectedClientId}`;
      const notificationDescription = `Se ha realizado un pedido con los siguientes artículos: ${articlesString}. Total: ${totalFormatted}`;

      // 4. Enviar la notificación de tipo PEDIDO
      await addNotificationToUser({
        userId: transaction.seller.id || "",
        notification: {
          title: notificationTitle,
          type: NotificationType.PEDIDO,
          schedule_from: new Date(schedule_from),
          schedule_to: new Date(schedule_to),
          description: notificationDescription,
          link: `/orders/${createdOrder.tmp_id}`,
          customer_id: selectedClientId || "",
        },
      }).unwrap();

      // 5. Crear el registro en CRM de tipo "ORDER"
      await createCrm({
        date: getLocalISOStringWithOffset(),
        type: ActionType.ORDER,
        insitu: updatedTransaction.insitu,
        status: StatusType.PENDING,
        notes: `Pedido Nro. ${createdOrder.tmp_id}. Observaciones: ${observations}`,
        collection_id: "",
        customer_id: selectedClientId || "",
        order_id: createdOrder.tmp_id,
        seller_id: transaction.seller.id || "",
      }).unwrap();

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onCancel();
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("orderConfirmation.genericError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-full">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
        </div>
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold text-gray-800">
              {t("orderConfirmation.title")}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            {error && (
              <div className="p-2 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">
                  {t("orderConfirmation.totalLabel")}
                </p>
                <p className="text-2xl font-semibold">{totalFormatted}</p>
              </div>
              <p className="text-gray-600 text-sm">
                {itemCount} {t("orderConfirmation.itemsLabel")}
              </p>
            </div>
            <p className="text-xs text-gray-500 italic">
              {t("orderConfirmation.notice")}
            </p>
            <div className="space-y-2">
              <p className="font-medium text-gray-700 text-sm">
                {t("orderConfirmation.gpsLabel")}
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="w-6 h-6 rounded-full bg-emerald-500 cursor-pointer flex justify-center items-center"
                  disabled={isSubmitting}
                >
                  <CiGps className="text-white" />
                </button>
                <span className="text-gray-600">
                  {insitu === null
                    ? t("orderConfirmation.notVerified")
                    : insitu
                    ? t("orderConfirmation.insitu")
                    : t("orderConfirmation.notInsitu")}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="observations"
                className="block text-gray-700 text-base font-bold"
              >
                {t("orderConfirmation.observationsLabel")}
              </label>
              <textarea
                id="observations"
                rows={3}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                placeholder={t("orderConfirmation.observationsPlaceholder")}
                value={observations}
                onChange={(e) => {
                  setObservations(e.target.value);
                  setTransaction((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }));
                }}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 font-bold"
              >
                {t("orderConfirmation.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedClientId}
                className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 font-bold"
              >
                {isSubmitting
                  ? t("orderConfirmation.processing")
                  : t("orderConfirmation.accept")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
