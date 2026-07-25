import React, { useState } from "react";
import { validateApiKey } from "../../services/api/geo";
import { useUser } from "../../hooks/useUser";
import ConfirmDialog from "../common/ConfirmDialog";
import {
  FiPlus,
  FiTrash2,
  FiKey,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
} from "react-icons/fi";

const ApiKeyManager = () => {
  const {
    apiKeys,
    addApiKey,
    deleteApiKey,
    activateApiKey,
    deactivateApiKey,
    decryptApiKey,
    loadApiKeys,
  } = useUser();

  const [newService, setNewService] = useState("openweather");
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [decryptedKeys, setDecryptedKeys] = useState({});
  const [visibleKeys, setVisibleKeys] = useState({});

  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "Ок",
    cancelText: "Нет",
    showCancel: true,
    onConfirm: null,
    onCancel: null,
  });

  const showMessage = (title, message, type = "info") => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      confirmText: "Ок",
      cancelText: "",
      showCancel: false,
      onConfirm: () => setDialog((prev) => ({ ...prev, isOpen: false })),
      onCancel: null,
    });
  };

  const showConfirm = (
    title,
    message,
    onConfirm,
    confirmText = "Да",
    cancelText = "Нет",
    type = "danger",
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      showCancel: true,
      onConfirm: () => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const handleAdd = async () => {
    if (!newKey.trim()) {
      showMessage("Ошибка", "Введите API-ключ", "danger");
      return;
    }
    if (!newName.trim()) {
      showMessage("Ошибка", "Введите название ключа", "danger");
      return;
    }
    setLoading(true);
    try {
      const isValid = await validateApiKey(newKey.trim());
      if (!isValid) {
        showMessage(
          "Ошибка",
          "Невалидный API-ключ. Проверьте правильность ввода.",
          "danger",
        );
        setLoading(false);
        return;
      }

      await addApiKey({
        service: newService,
        name_key: newName.trim(),
        plain_key: newKey.trim(),
      });
      setNewName("");
      setNewKey("");
    } catch (err) {
      showMessage(
        "Ошибка",
        "Ошибка при добавлении ключа: " + err.message,
        "danger",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDecrypt = async (keyId) => {
    if (visibleKeys[keyId]) {
      setVisibleKeys((prev) => ({ ...prev, [keyId]: false }));
      return;
    }
    setLoading(true);
    try {
      const decrypted = await decryptApiKey(keyId);
      setDecryptedKeys((prev) => ({ ...prev, [keyId]: decrypted }));
      setVisibleKeys((prev) => ({ ...prev, [keyId]: true }));
    } catch (err) {
      showMessage(
        "Ошибка",
        "Не удалось расшифровать ключ: " + err.message,
        "danger",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (key) => {
    setLoading(true);
    try {
      if (key.is_active) {
        await deactivateApiKey(key.id);
      } else {
        await activateApiKey(key.id);
      }
    } catch (err) {
      showMessage(
        "Ошибка",
        "Ошибка изменения статуса: " + err.message,
        "danger",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (keyId) => {
    showConfirm(
      "Удаление API-ключа",
      "Вы уверены, что хотите удалить этот API-ключ?",
      async () => {
        setLoading(true);
        try {
          await deleteApiKey(keyId);
        } catch (err) {
          showMessage(
            "Ошибка",
            "Не удалось удалить ключ: " + err.message,
            "danger",
          );
        } finally {
          setLoading(false);
        }
      },
      "Удалить",
      "Отмена",
      "danger",
    );
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await loadApiKeys();
    } catch (err) {
      showMessage("Ошибка", "Ошибка загрузки: " + err.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#ebdbb2] flex items-center gap-2">
          <FiKey size={20} /> API ключи
        </h2>
        <button
          onClick={handleRefresh}
          className="text-sm bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] px-3 py-1 rounded-full transition flex items-center gap-1"
          disabled={loading}
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={newService}
          onChange={(e) => setNewService(e.target.value)}
          className="bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-4 text-[#ebdbb2] focus:outline-none focus:ring-2 focus:ring-[#fabd2f] flex-shrink-0"
        >
          <option value="openweather">OpenWeather</option>
        </select>
        <input
          type="text"
          placeholder="Название ключа"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 min-w-[120px] bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-4 text-[#ebdbb2] placeholder:text-[#928374] focus:outline-none focus:ring-2 focus:ring-[#fabd2f]"
        />
        <input
          type="text"
          placeholder="API ключ"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1 min-w-[120px] bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-4 text-[#ebdbb2] placeholder:text-[#928374] focus:outline-none focus:ring-2 focus:ring-[#fabd2f]"
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="bg-[#fe8019] hover:bg-[#fabd2f] text-[#1d2021] px-4 py-2 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 flex-shrink-0"
        >
          <FiPlus size={18} /> Добавить
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <p className="text-sm text-[#928374] text-center py-4">
          Нет сохранённых API-ключей
        </p>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#1d2021] border border-[#ebdbb2]/10"
            >
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[150px]">
                <span className="font-medium text-[#ebdbb2]">
                  {key.name_key || "Без названия"}
                </span>
                <span className="text-xs text-[#928374]">{key.service}</span>
                <span className="text-xs text-[#83a598] font-mono">
                  {key.last_four ? `···${key.last_four}` : "····"}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    key.is_active
                      ? "bg-green-900/50 text-green-300"
                      : "bg-red-900/50 text-red-300"
                  }`}
                >
                  {key.is_active ? "Активен" : "Неактивен"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleDecrypt(key.id)}
                  className="text-[#928374] hover:text-[#fabd2f] transition p-1"
                  title={visibleKeys[key.id] ? "Скрыть ключ" : "Показать ключ"}
                >
                  {visibleKeys[key.id] ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
                {visibleKeys[key.id] && (
                  <span className="text-xs text-[#83a598] font-mono break-all max-w-[150px]">
                    {decryptedKeys[key.id] || "..."}
                  </span>
                )}

                <button
                  onClick={() => handleToggleActive(key)}
                  className={`text-xs px-3 py-1 rounded-full transition whitespace-nowrap ${
                    key.is_active
                      ? "bg-red-800/50 hover:bg-red-700 text-[#ebdbb2]"
                      : "bg-green-800/50 hover:bg-green-700 text-[#ebdbb2]"
                  }`}
                  title={
                    key.is_active ? "Деактивировать ключ" : "Активировать ключ"
                  }
                >
                  {key.is_active ? "Деактивировать" : "Активировать"}
                </button>

                <button
                  onClick={() => handleDelete(key.id)}
                  className="text-[#928374] hover:text-[#fb4934] transition p-1"
                  title="Удалить ключ"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#928374] mt-4">
        Ключи хранятся в зашифрованном виде. Последние 4 символа отображаются
        для идентификации.
      </p>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        showCancel={dialog.showCancel}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onCancel}
      />
    </div>
  );
};

export default ApiKeyManager;
