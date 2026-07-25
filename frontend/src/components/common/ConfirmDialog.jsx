import React, { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Да",
  cancelText = "Нет",
  type = "danger",
  showCancel = true,
}) => {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmButtonClass =
    type === "danger"
      ? "bg-[#fb4934] hover:bg-[#cc241d] text-[#ebdbb2]"
      : type === "warning"
        ? "bg-[#fabd2f] hover:bg-[#fe8019] text-[#1d2021]"
        : "bg-[#83a598] hover:bg-[#458588] text-[#ebdbb2]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 w-full max-w-md overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center p-4 border-b border-[#ebdbb2]/20">
          <h3 className="text-lg font-semibold text-[#ebdbb2]">{title}</h3>
          <button
            onClick={onCancel}
            className="text-[#928374] hover:text-[#ebdbb2] transition"
            aria-label="Закрыть"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-[#ebdbb2]">{message}</p>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-[#ebdbb2]/20">
          {showCancel && cancelText && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-full bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] transition"
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-full font-medium transition ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
