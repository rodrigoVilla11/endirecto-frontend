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
    if (mdOnOverlay.current && e.target === overlayRef.current) {
      onClose();
    }
    mdOnOverlay.current = false;
  };

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center z-[60] bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className="relative bg-transparent w-full h-full sm:w-auto sm:h-auto sm:max-w-7xl sm:max-h-[95vh] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full h-full overflow-y-auto hide-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;