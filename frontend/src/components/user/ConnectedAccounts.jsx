import React, { useEffect, useState } from "react";
import { useUser } from "../../hooks/useUser";
import { FiGithub, FiMail, FiLink, FiAlertCircle } from "react-icons/fi";
import ConfirmDialog from "../common/ConfirmDialog";
import { useAuth } from "../../hooks/useAuth";

const providerIcons = {
  github: <FiGithub size={24} />,
  google: <FiMail size={24} />,
  email: <FiMail size={24} />,
  yandex: <FiMail size={24} />,
  default: <FiLink size={24} />,
};

const ConnectedAccounts = () => {
  const { authProviders, unlinkProvider, linkGitHub, loadAuthProviders } =
    useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const hasPassword = user?.hasPassword || false;

  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Да",
    cancelText: "Нет",
    type: "danger",
    showCancel: true,
    onConfirm: null,
    onCancel: null,
  });

  useEffect(() => {
    loadAuthProviders();
  }, []);

  const showDialog = (
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Да",
    cancelText = "Нет",
    type = "danger",
    showCancel = true,
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      showCancel,
      onConfirm: () => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
        if (onCancel) onCancel();
      },
    });
  };

  const handleUnlink = async (authId, providerName, providerType) => {
    if (providerType !== "email" && !hasPassword) {
      showDialog(
        "⚠️ Невозможно отвязать аккаунт",
        "Это единственный способ входа. Чтобы отвязать его, сначала установите пароль (войдите по email) или добавьте другой способ входа.",
        () => {},
        () => {},
        "Ок",
        "",
        "warning",
        false,
      );
      return;
    }

    showDialog(
      "Отключить аккаунт",
      `Вы действительно хотите отключить "${providerName}"? Вы сможете войти снова, но связь будет разорвана.`,
      async () => {
        setLoading(true);
        setError("");
        try {
          await unlinkProvider(authId);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      null,
      "Да, отключить",
      "Отмена",
      "danger",
      true,
    );
  };

  const hasGitHub = authProviders.some((p) => p.provider === "github");

  return (
    <>
      <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 p-6">
        <h2 className="text-xl font-semibold text-[#ebdbb2] mb-4">
          Подключённые аккаунты
        </h2>
        {error && (
          <div className="mb-4 p-2 bg-red-900/30 text-red-300 rounded-xl flex items-center gap-2">
            <FiAlertCircle /> {error}
          </div>
        )}
        <div className="space-y-3">
          {authProviders.map((provider) => {
            const icon =
              providerIcons[provider.provider] || providerIcons.default;
            const isEmail = provider.provider === "email";
            return (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1d2021]"
              >
                <div className="flex items-center gap-3">
                  {icon}
                  <span className="text-[#ebdbb2] font-medium">
                    {provider.provider === "github" && "GitHub"}
                    {provider.provider === "email" && "Email"}
                    {provider.provider === "google" && "Google"}
                    {provider.provider === "yandex" && "Yandex"}
                  </span>
                  {provider.provider_username && (
                    <span className="text-sm text-[#928374]">
                      ({provider.provider_username})
                    </span>
                  )}
                </div>
                <div>
                  {isEmail ? (
                    <span className="text-xs text-[#928374]">
                      Основной способ входа
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        handleUnlink(
                          provider.id,
                          provider.provider,
                          provider.provider,
                        )
                      }
                      disabled={loading}
                      className="px-3 py-1 rounded-full text-sm bg-red-800/50 hover:bg-red-700 text-[#ebdbb2] transition"
                    >
                      Отключить
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {!hasGitHub && (
            <button
              onClick={linkGitHub}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] py-3 rounded-xl transition"
            >
              <FiGithub size={20} /> Подключить GitHub
            </button>
          )}
        </div>
        <p className="text-xs text-[#928374] mt-4">
          Подключённые аккаунты позволяют входить в приложение через сторонние
          сервисы.
        </p>
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        type={dialog.type}
        showCancel={dialog.showCancel}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onCancel}
      />
    </>
  );
};

export default ConnectedAccounts;
