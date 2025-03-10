import { BellIcon, XIcon } from "lucide-react";
import React from "react";

const NotificationsDetail = ({ notification, closeModal }: any) => {
  if (!notification) return null;

  // Determinar el tipo de notificación y su color (si existe un campo type)
  const getNotificationStyle = () => {
    if (!notification.type) return { icon: BellIcon, bgColor: "bg-blue-100", textColor: "text-blue-800", iconColor: "text-blue-500" };

    switch (notification.type?.toLowerCase()) {
      case "success":
        return { 
          icon: BellIcon, 
          bgColor: "bg-green-100", 
          textColor: "text-green-800",
          iconColor: "text-green-500"
        };
      case "warning":
        return { 
          icon: BellIcon, 
          bgColor: "bg-yellow-100", 
          textColor: "text-yellow-800",
          iconColor: "text-yellow-500"
        };
      case "error":
        return { 
          icon: BellIcon, 
          bgColor: "bg-red-100", 
          textColor: "text-red-800",
          iconColor: "text-red-500"
        };
      default:
        return { 
          icon: BellIcon, 
          bgColor: "bg-blue-100", 
          textColor: "text-blue-800",
          iconColor: "text-blue-500"
        };
    }
  };

  const { icon: Icon, bgColor, textColor, iconColor } = getNotificationStyle();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Icon className={`h-6 w-6 mr-2 ${iconColor}`} />
          Notificación
        </h2>
        <button 
          onClick={closeModal}
          className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Notification title with background */}
        <div className={`${bgColor} ${textColor} px-4 py-3 rounded-lg mb-4`}>
          <h3 className="font-semibold text-lg">{notification.title}</h3>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-700 whitespace-pre-line">{notification.description}</p>
        </div>

        {/* Date if available */}
        {notification.date && (
          <div className="text-sm text-gray-500 mb-6">
            Recibido: {new Date(notification.date).toLocaleString()}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
          >
            Cerrar
          </button>
          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Ver detalles
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsDetail;