import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../hooks/useUser";
import { useNavigate } from "react-router-dom";
import SettingsPanel from "./SettingsPanel";
import ConnectedAccounts from "./ConnectedAccounts";
import ConfirmDialog from "../common/ConfirmDialog";
import ApiKeyManager from "./ApiKeyManager";
import {
  FiSave,
  FiEdit2,
  FiX,
  FiHome,
  FiLock,
  FiTrash2,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

const ProfilePage = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const {
    profile,
    updateProfile,
    changePassword,
    deactivateAccount,
    authProviders,
    loadAuthProviders,
  } = useUser();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const hasPassword = user?.hasPassword || false;

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || "");
      setEmail(user.email || "");
    }
  }, [user]);

  if (authLoading) return <div>Загрузка...</div>;
  if (!user) return <div>Пользователь не найден</div>;

  const handleSave = async () => {
    await updateProfile({ username: nickname, email });
    setEditMode(false);
  };

  const goHome = () => navigate("/");

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }
    try {
      await changePassword(hasPassword ? oldPassword : "", newPassword);
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");

      setDialog({
        isOpen: true,
        title: hasPassword ? "Пароль изменён" : "Пароль создан",
        message: hasPassword
          ? "Ваш пароль успешно изменён."
          : "Пароль успешно создан. Теперь вы можете войти по email и паролю.",
        type: "info",
        confirmText: "Ок",
        cancelText: "",
        showCancel: false,
        onConfirm: async () => {
          await loadAuthProviders();
          setDialog((prev) => ({ ...prev, isOpen: false }));
        },
        onCancel: null,
      });
    } catch (err) {
      setDialog({
        isOpen: true,
        title: "Ошибка",
        message: err.message || "Не удалось изменить пароль",
        type: "danger",
        confirmText: "Ок",
        cancelText: "",
        showCancel: false,
        onConfirm: () => setDialog((prev) => ({ ...prev, isOpen: false })),
        onCancel: null,
      });
    }
  };

  const handleDeleteAccount = () => {
    setDialog({
      isOpen: true,
      title: "Удаление аккаунта",
      message:
        "Вы уверены, что хотите деактивировать аккаунт? Это действие необратимо.",
      type: "danger",
      confirmText: "Да, удалить",
      cancelText: "Отмена",
      showCancel: true,
      onConfirm: async () => {
        try {
          await deactivateAccount();
          await logout();
          navigate("/login?deactivated=true");
        } catch (err) {
          setDialog({
            isOpen: true,
            title: "Ошибка удаления",
            message: err.message || "Не удалось деактивировать аккаунт",
            type: "danger",
            confirmText: "Ок",
            cancelText: "",
            showCancel: false,
            onConfirm: () => setDialog((prev) => ({ ...prev, isOpen: false })),
            onCancel: null,
          });
        }
      },
      onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#ebdbb2]">Профиль</h1>
        <button
          onClick={goHome}
          className="flex items-center gap-2 bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] px-4 py-2 rounded-full transition"
        >
          <FiHome size={18} /> На главную
        </button>
      </div>

      <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#ebdbb2]">
            Личные данные
          </h2>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="text-[#fabd2f] hover:text-[#fe8019] transition flex items-center gap-1"
            >
              <FiEdit2 size={16} /> Редактировать
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="bg-[#fabd2f] hover:bg-[#fe8019] text-[#1d2021] px-3 py-1 rounded-full text-sm transition flex items-center gap-1"
              >
                <FiSave size={14} /> Сохранить
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] px-3 py-1 rounded-full text-sm transition flex items-center gap-1"
              >
                <FiX size={14} /> Отмена
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#928374] mb-1">Никнейм</label>
            {editMode ? (
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-4 text-[#ebdbb2] focus:ring-2 focus:ring-[#fabd2f] focus:outline-none"
              />
            ) : (
              <div className="bg-[#1d2021] rounded-xl py-2 px-4 min-h-[42px] flex items-center">
                <span className="text-[#ebdbb2]">{nickname || "—"}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-[#928374] mb-1">Email</label>
            {editMode ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-4 text-[#ebdbb2] focus:ring-2 focus:ring-[#fabd2f] focus:outline-none"
              />
            ) : (
              <div className="bg-[#1d2021] rounded-xl py-2 px-4 min-h-[42px] flex items-center">
                <span className="text-[#ebdbb2]">{email || "—"}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] px-4 py-2 rounded-full transition"
            >
              <FiLock size={16} />
              {hasPassword ? "Сменить пароль" : "Создать пароль"}
            </button>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 bg-red-800/50 hover:bg-red-800 text-[#ebdbb2] px-4 py-2 rounded-full transition"
            >
              <FiTrash2 size={16} /> Удалить аккаунт
            </button>
          </div>
        </div>
      </div>

      <SettingsPanel />
      <ConnectedAccounts />
      <ApiKeyManager />

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 w-full max-w-md relative shadow-xl">
            <div className="flex justify-between items-center p-5 border-b border-[#ebdbb2]/20">
              <h3 className="text-xl font-semibold text-[#ebdbb2]">
                {hasPassword ? "Смена пароля" : "Создание пароля"}
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-[#928374] hover:text-[#ebdbb2] transition"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              {hasPassword && (
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Старый пароль"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-4 text-[#ebdbb2] placeholder:text-[#928374] focus:outline-none focus:ring-2 focus:ring-[#fabd2f] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#928374] hover:text-[#ebdbb2]"
                  >
                    {showOldPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
              )}
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-4 text-[#ebdbb2] placeholder:text-[#928374] focus:outline-none focus:ring-2 focus:ring-[#fabd2f] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#928374] hover:text-[#ebdbb2]"
                >
                  {showNewPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Подтверждение пароля"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-4 text-[#ebdbb2] placeholder:text-[#928374] focus:outline-none focus:ring-2 focus:ring-[#fabd2f] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#928374] hover:text-[#ebdbb2]"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-400 text-sm">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 pt-0">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="px-4 py-2 rounded-full bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] transition"
              >
                Отмена
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 rounded-full bg-[#fabd2f] hover:bg-[#fe8019] text-[#1d2021] transition font-medium"
              >
                {hasPassword ? "Изменить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default ProfilePage;
