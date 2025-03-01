import React from "react";
import ReactDOM from "react-dom";

const Modal = ({ isOpen, onClose, children }: any) => {
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black bg-opacity-50">
      <div className="relative bg-white p-4 rounded-lg shadow-lg w-[90%] h-full sm:w-auto sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto">
        {/* <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          &times;
        </button> */}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
