const NotificationsDetail = ({ notification, closeModal }: any) => {
  if (!notification) return null;
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">{notification.title}</h2>
      <p className="mb-4">{notification.description}</p>
      <button
        onClick={closeModal}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Cerrar
      </button>
    </div>
  );
};

export default NotificationsDetail