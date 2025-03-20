"use client";

import { useState } from "react";
import { Check, Clock, Calendar, Bell, Users, Store, UserCircle, ChevronDown } from 'lucide-react';
import { useGetNotificationsQuery } from "@/redux/services/notificationsApi";
import {
  useGetUsersQuery,
  Roles,
  useAddNotificationToUserMutation,
  useAddNotificationToUsersByRolesMutation,
} from "@/redux/services/usersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useAddNotificationToCustomersMutation } from "@/redux/services/customersApi";
import { CreateUserNotificationDto } from "@/redux/services/usersApi";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
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

  const [selectedRoles, setSelectedRoles] = useState<Roles[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({ notification: "", date: "", time: "" });
  const [duration, setDuration] = useState<number>(24);
  const [notificationState, setNotificationState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("roles");

  // Estado para mostrar el tick
  const [showTick, setShowTick] = useState(false);

  const sections: Section[] = [
    {
      id: "roles",
      title: "Roles",
      icon: <UserCircle className="h-5 w-5" />,
      isOptional: true,
      items: ["ADMINISTRADOR", "MARKETING", "OPERADOR", "VENDEDOR"],
    },
    {
      id: "sellers",
      title: "Vendedores",
      icon: <Store className="h-5 w-5" />,
      isOptional: true,
      items: [],
    },
    {
      id: "customers",
      title: "Clientes",
      icon: <Users className="h-5 w-5" />,
      isOptional: true,
      items: [],
    },
  ];

  const handleSelectAll = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      if (sectionId === "roles") {
        setSelectedRoles([...section.items] as Roles[]);
      } else if (sectionId === "sellers" || sectionId === "customers") {
        if (sellersData) {
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
    const [year, month, day] = formData.date.split("-").map(Number);
    const [hour, minute] = formData.time.split(":").map(Number);
    const scheduleFromLocal = new Date(year, month - 1, day, hour, minute);
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

    // Enviar notificaciones a clientes
    const customerSellerIds = newNotificationState.customer_seller_id;
    if (customerSellerIds && customerSellerIds.length > 0) {
      for (const sellerId of customerSellerIds) {
        await addNotificationToCustomers({
          sellerId,
          notification: notificationDto,
        });
      }
    }

    // Enviar notificaciones a usuarios (vendedores)
    const sellerUserIds = newNotificationState.seller_id;
    if (sellerUserIds && sellerUserIds.length > 0) {
      for (const userId of sellerUserIds) {
        await addNotificationToUser({
          userId,
          notification: notificationDto,
        });
      }
    }

    // Enviar notificaciones a roles
    if (selectedRoles && selectedRoles.length > 0) {
      await addNotificationToUsersByRoles({
        roles: selectedRoles,
        notification: notificationDto,
      });
    }

    setNotificationState(newNotificationState);
    setShowTick(true);
    setTimeout(() => setShowTick(false), 3000);
  };

  if (isLoading || isLoadingUsers || isLoadingSellers)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
    
  if (error || errorUsers || errorSellers)
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md shadow-sm border border-red-200 text-center">
        Error al cargar datos. Por favor, intente nuevamente.
      </div>
    );

  // Count selected items for badges
  const getSelectedCount = (sectionId: string) => {
    if (sectionId === "roles") return selectedRoles.length;
    return selectedItems[sectionId]?.length || 0;
  };

  return (
    <>
      {/* Overlay del tick */}
      {showTick && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm transition-all">
          <div className="bg-white p-8 rounded-full shadow-lg animate-in zoom-in-50 duration-300">
            <Check className="h-16 w-16 text-green-500" />
          </div>
        </div>
      )}

      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Publicación de Notificaciones</h1>
        </div>
        
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold">Detalles de la Notificación</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Bell className="h-4 w-4 text-gray-500" />
                  Notificación
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Fecha
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                  <button 
                    onClick={handleNow}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors flex items-center text-sm whitespace-nowrap"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Ahora
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Hora
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, time: e.target.value }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Duración
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
          </div>
        </div>
        
        {/* Secciones con Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold">Destinatarios</h2>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative
                    ${activeTab === section.id 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  {section.icon}
                  {section.title}
                  {getSelectedCount(section.id) > 0 && (
                    <span className="ml-1 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {getSelectedCount(section.id)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {sections.map((section) => (
              <div 
                key={section.id} 
                className={`${activeTab === section.id ? 'block' : 'hidden'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium flex items-center gap-2 text-gray-700">
                    {section.icon}
                    {section.title}
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSelectAll(section.id)} 
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 text-sm transition-colors"
                    >
                      Seleccionar Todo
                    </button>
                    <button 
                      onClick={() => handleSelectNone(section.id)} 
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 text-sm transition-colors"
                    >
                      Deseleccionar Todo
                    </button>
                  </div>
                </div>
                
                <div className="h-px bg-gray-200 my-4"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                  {section.id === "sellers" || section.id === "customers" ? (
                    sellersData?.map((seller: any) => {
                      const sellerId = seller.id;
                      return (
                        <label key={sellerId} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={isItemSelected(section.id, sellerId)}
                            onChange={() => handleItemToggle(section.id, sellerId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{seller.name}</span>
                        </label>
                      );
                    })
                  ) : (
                    section.items.map((item) => (
                      <label key={item} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={isItemSelected(section.id, item)}
                          onChange={() => handleItemToggle(section.id, item)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Botón de envío */}
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSubmit}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-2 font-medium"
          >
            <Check className="h-5 w-5" />
            Publicar Notificación
          </button>
        </div>
      </div>
    </>
  );
}
