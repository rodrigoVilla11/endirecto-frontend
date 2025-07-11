import React from "react";
import ReactDOM from "react-dom";

const Modal = ({ isOpen, onClose, children }: any) => {
  if (!isOpen) return null;
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Solo cerrar si se hace click en el backdrop, no en el contenido
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center z-40 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative bg-white p-4 rounded-lg shadow-lg w-[90%] h-full sm:w-auto sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
