"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useGetNotificationsQuery } from "@/redux/services/notificationsApi";
import {
  useGetUsersQuery,
  Roles,
  useAddNotificationToUserMutation,
  useAddNotificationToUsersByRolesMutation,
} from "@/redux/services/usersApi"; // Asegúrate de ajustar la ruta según tu proyecto
import { useGetSellersQuery } from "@/redux/services/sellersApi"; // Ajusta la ruta según tu proyecto
import { useAddNotificationToCustomersMutation } from "@/redux/services/customersApi";
import { CreateUserNotificationDto } from "@/redux/services/usersApi";

interface Section {
  id: string;
  title: string;
  isRequired?: boolean;
  isOptional?: boolean;
  items: string[];
}

export default function NotificationForm() {
  const { data: notifications, isLoading, error } = useGetNotificationsQuery(null);
  const { data: usersData, isLoading: isLoadingUsers, error: errorUsers } = useGetUsersQuery(null);
  const { data: sellersData, isLoading: isLoadingSellers, error: errorSellers } = useGetSellersQuery(null);
  
  const [addNotificationToCustomers] = useAddNotificationToCustomersMutation();
  const [addNotificationToUser] = useAddNotificationToUserMutation();
  const [addNotificationToUsersByRoles] = useAddNotificationToUsersByRolesMutation();

  if (error) console.error("Error al cargar notificaciones:", error);
  if (errorUsers) console.error("Error al cargar usuarios:", errorUsers);
  if (errorSellers) console.error("Error al cargar vendedores:", errorSellers);

  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  // Tipamos el estado de roles como Roles[]
  const [selectedRoles, setSelectedRoles] = useState<Roles[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({ notification: "", date: "", time: "" });
  const [duration, setDuration] = useState<number>(24);
  const [notificationState, setNotificationState] = useState<any>(null);

  console.log("notificationState", notificationState);

  const sections: Section[] = [
    {
      id: "roles",
      title: "Roles",
      isRequired: true,
      items: ["ADMINISTRADOR", "MARKETING", "OPERADOR", "VENDEDOR"],
    },
    {
      id: "sellers",
      title: "Vendedores",
      isOptional: true,
      items: [],
    },
    {
      id: "customers",
      title: "Clientes",
      isOptional: true,
      items: [],
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSelectAll = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      if (sectionId === "roles") {
        setSelectedRoles([...section.items] as Roles[]);
      } else if (sectionId === "sellers" || sectionId === "customers") {
        if (sellersData) {
          // Usamos seller.id en lugar de _id
          const allSellerIds = sellersData.map((seller: any) => seller.id);
          setSelectedItems((prev) => ({ ...prev, [sectionId]: allSellerIds }));
        }
      } else {
        setSelectedItems((prev) => ({ ...prev, [sectionId]: [...section.items] }));
      }
    }
  };

  const handleSelectNone = (sectionId: string) => {
    if (sectionId === "roles") {
      setSelectedRoles([]);
    } else {
      setSelectedItems((prev) => ({ ...prev, [sectionId]: [] }));
    }
  };

  const handleItemToggle = (sectionId: string, item: string) => {
    if (sectionId === "roles") {
      setSelectedRoles((prev) =>
        prev.includes(item as Roles)
          ? prev.filter((role) => role !== item)
          : [...prev, item as Roles]
      );
      return;
    }
    setSelectedItems((prev) => {
      const current = prev[sectionId] || [];
      return {
        ...prev,
        [sectionId]: current.includes(item)
          ? current.filter((i) => i !== item)
          : [...current, item],
      };
    });
  };

  const isItemSelected = (sectionId: string, item: string) => {
    if (sectionId === "roles") return selectedRoles.includes(item as Roles);
    return selectedItems[sectionId]?.includes(item) || false;
  };

  // Función que utiliza valores locales para fecha y hora
  const handleNow = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;
    const currentTime = `${hours}:${minutes}`;
    setFormData((prev) => ({ ...prev, date: today, time: currentTime }));
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.time) {
      alert("Por favor, complete la fecha y hora.");
      return;
    }
    if (!formData.notification) {
      alert("Seleccione una notificación.");
      return;
    }
    // Construir la fecha local a partir de componentes
    const [year, month, day] = formData.date.split("-").map(Number);
    const [hour, minute] = formData.time.split(":").map(Number);
    const scheduleFromLocal = new Date(year, month - 1, day, hour, minute);
    // "Congelar" la hora local en UTC restando el offset
    const scheduleFrom = new Date(
      scheduleFromLocal.getTime() - scheduleFromLocal.getTimezoneOffset() * 60 * 1000
    );
    const scheduleTo = new Date(scheduleFrom.getTime() + duration * 60 * 60 * 1000);

    const selectedNotification = notifications?.notifications.find(
      (n: any) => (n._id.$oid || n._id) === formData.notification
    );
    if (!selectedNotification) {
      alert("Notificación no encontrada.");
      return;
    }

    const newNotificationState = {
      ...selectedNotification,
      schedule_from: scheduleFrom,
      schedule_to: scheduleTo,
      role: selectedRoles.length === 1 ? selectedRoles[0] : selectedRoles,
      seller_id: selectedItems["sellers"] || [],
      customer_seller_id: selectedItems["customers"] || [],
    };

    const notificationDto: CreateUserNotificationDto = {
      article_id: newNotificationState.article_id,
      brand_id: newNotificationState.brand_id,
      description: newNotificationState.description,
      link: newNotificationState.link,
      schedule_from: scheduleFrom,
      schedule_to: scheduleTo,
      title: newNotificationState.title,
      type: newNotificationState.type,
    };

    // Si hay customer_seller_id, usamos addNotificationToCustomersMutation
    const customerSellerIds = newNotificationState.customer_seller_id;
    if (customerSellerIds && customerSellerIds.length > 0) {
      for (const sellerId of customerSellerIds) {
        await addNotificationToCustomers({
          sellerId,
          notification: notificationDto,
        });
      }
    }

    // Si se seleccionó seller_id (para usuarios), usamos addNotificationToUserMutation
    const sellerUserIds = newNotificationState.seller_id;
    if (sellerUserIds && sellerUserIds.length > 0) {
      for (const userId of sellerUserIds) {
        await addNotificationToUser({
          userId,
          notification: notificationDto,
        });
      }
    }

    // Si se seleccionaron roles, se llama al endpoint para agregar notificaciones a usuarios por role
    if (selectedRoles && selectedRoles.length > 0) {
      await addNotificationToUsersByRoles({
        roles: selectedRoles,
        notification: notificationDto,
      });
    }

    setNotificationState(newNotificationState);
    console.log("Notification state:", newNotificationState);
  };

  if (isLoading || isLoadingUsers || isLoadingSellers)
    return <div>Cargando datos...</div>;
  if (error || errorUsers || errorSellers)
    return <div>Error al cargar datos.</div>;

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">PUBLICACIÓN DE NOTIFICACIONES</h1>
      {/* Form Header */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Notificación</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.notification}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notification: e.target.value }))
            }
          >
            <option value="">Seleccione una notificación...</option>
            {notifications?.notifications
              .filter((notif: any) => notif.type === "NOVEDAD")
              .map((notif: any) => (
                <option
                  key={notif._id.$oid || notif._id}
                  value={notif._id.$oid || notif._id}
                >
                  {notif.title}
                </option>
              ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <div className="flex gap-2">
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
            />
            <button
              onClick={handleNow}
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              Ahora
            </button>
          </div>
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Hora</label>
          <input
            type="time"
            className="w-full p-2 border rounded"
            value={formData.time}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, time: e.target.value }))
            }
          />
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Duración</label>
          <select
            className="w-full p-2 border rounded"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value={24}>24 horas</option>
            <option value={48}>48 horas</option>
            <option value={168}>1 semana</option>
            <option value={336}>2 semanas</option>
            <option value={720}>1 mes</option>
          </select>
        </div>
      </div>
      {/* Secciones */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="border rounded-sm">
            <div className="bg-primary text-white p-3 flex items-center justify-between">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-2 flex-1"
              >
                <span>{section.title}</span>
                {section.isRequired && (
                  <span className="text-sm">(requerido)</span>
                )}
                {section.isOptional && (
                  <span className="text-sm">(opcional)</span>
                )}
                {expandedSections.includes(section.id) ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectAll(section.id)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  Todo
                </button>
                <button
                  onClick={() => handleSelectNone(section.id)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  Nada
                </button>
              </div>
            </div>
            {expandedSections.includes(section.id) && (
              <div className="p-4 space-y-2">
                {section.id === "sellers" || section.id === "customers" ? (
                  sellersData?.map((seller: any) => {
                    const sellerId = seller.id; // Se usa seller.id
                    return (
                      <label key={sellerId} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isItemSelected(section.id, sellerId)}
                          onChange={() => handleItemToggle(section.id, sellerId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{seller.name}</span>
                      </label>
                    );
                  })
                ) : (
                  section.items.map((item) => (
                    <label key={item} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isItemSelected(section.id, item)}
                        onChange={() => handleItemToggle(section.id, item)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Botón de envío */}
      <div className="mt-6 flex justify-end">
        <button
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          onClick={handleSubmit}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
