import React, { useRef } from "react";
import ReactDOM from "react-dom";

const Modal = ({ isOpen, onClose, children }: any) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mdOnOverlay = useRef(false);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    mdOnOverlay.current = e.target === overlayRef.current;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Cerrar sólo si el mousedown y el mouseup fueron en el overlay
    if (mdOnOverlay.current && e.target === overlayRef.current) {
      onClose();
    }
    mdOnOverlay.current = false;
  };

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center z-40 bg-black bg-opacity-50 "
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className="relative bg-white p-4 rounded-lg shadow-lg w-[90%] h-full sm:w-auto sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()} // <- clave extra
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
