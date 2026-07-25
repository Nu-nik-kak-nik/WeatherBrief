import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Да",
    cancelText: "Нет",
    type: "danger",
    onConfirm: null,
    onCancel: null,
  });

  const showConfirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setDialog({
          isOpen: true,
          title: options.title || "Подтверждение",
          message: options.message || "Вы уверены?",
          confirmText: options.confirmText || "Да",
          cancelText: options.cancelText || "Нет",
          type: options.type || "danger",
          onConfirm: () => {
            setDialog((prev) => ({ ...prev, isOpen: false }));
            resolve(true);
          },
          onCancel: () => {
            setDialog((prev) => ({ ...prev, isOpen: false }));
            resolve(false);
          },
        });
      }),
    [],
  );

  const showAlert = useCallback(
    (message, title = "Уведомление") =>
      new Promise((resolve) => {
        setDialog({
          isOpen: true,
          title,
          message,
          confirmText: "OK",
          cancelText: null,
          type: "info",
          onConfirm: () => {
            setDialog((prev) => ({ ...prev, isOpen: false }));
            resolve();
          },
          onCancel: () => {
            setDialog((prev) => ({ ...prev, isOpen: false }));
            resolve();
          },
        });
      }),
    [],
  );

  const closeDialog = useCallback(() => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ConfirmContext.Provider value={{ showConfirm, showAlert, closeDialog }}>
      {children}
      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onCancel}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context)
    throw new Error("useConfirm must be used within ConfirmProvider");
  return context;
};
