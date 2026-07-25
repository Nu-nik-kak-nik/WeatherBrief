import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiGithub,
  FiArrowLeft,
  FiGlobe,
  FiThermometer,
} from "react-icons/fi";

const RegisterPage = () => {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, githubLogin } = useAuth();
  const navigate = useNavigate();

  const [preferredLang, setPreferredLang] = useState("ru");
  const [defaultUnits, setDefaultUnits] = useState("metric");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(nickname)) {
      setError(
        "Никнейм может содержать только буквы, цифры, дефисы и подчёркивания",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Введите корректный email");
      return;
    }

    setLoading(true);
    try {
      await register(nickname, email, password, preferredLang, defaultUnits);
      navigate("/");
    } catch (err) {
      setError(err.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = async () => {
    await githubLogin();
    navigate("/");
  };

  const goHome = () => navigate("/");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1d2021]">
      <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 p-8 w-full max-w-md relative">
        <button
          onClick={goHome}
          className="absolute top-4 left-4 flex items-center gap-1 text-[#928374] hover:text-[#fabd2f] transition-colors text-sm md:text-base"
          title="На главную"
        >
          <FiArrowLeft size={18} />
          <span className="hidden sm:inline">На главную</span>
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 text-[#ebdbb2]">
          Регистрация
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <FiUser
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#928374]"
              size={18}
            />
            <input
              type="text"
              placeholder="Никнейм"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-2xl py-3 pl-11 pr-4 text-[#ebdbb2] placeholder:text-[#928374] focus:outline-none focus:ring-2 focus:ring-[#fabd2f] focus:border-transparent transition"
              required
            />
          </div>

          <div className="relative">
            <FiMail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#928374]"
              size={18}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-2xl py-3 pl-11 pr-4 text-[#ebdbb2] placeholder:text-[#928374] focus:outline-none focus:ring-2 focus:ring-[#fabd2f] focus:border-transparent transition"
              required
            />
          </div>

          <div className="relative">
            <FiLock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#928374]"
              size={18}
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-2xl py-3 pl-11 pr-12 text-[#ebdbb2] placeholder:text-[#928374] focus:outline-none focus:ring-2 focus:ring-[#fabd2f] focus:border-transparent transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#928374] hover:text-[#ebdbb2]"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          <div className="relative">
            <FiLock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#928374]"
              size={18}
            />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Подтверждение пароля"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-2xl py-3 pl-11 pr-12 text-[#ebdbb2] placeholder:text-[#928374] focus:outline-none focus:ring-2 focus:ring-[#fabd2f] focus:border-transparent transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#928374] hover:text-[#ebdbb2]"
            >
              {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          <div>
            <label className="block text-sm text-[#928374] mb-1 flex items-center gap-2">
              <FiGlobe size={16} /> Язык
            </label>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value)}
              className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-4 text-[#ebdbb2] focus:outline-none focus:ring-2 focus:ring-[#fabd2f] focus:border-transparent appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23928374' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "12px",
              }}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#928374] mb-1 flex items-center gap-2">
              <FiThermometer size={16} /> Единицы измерения
            </label>
            <select
              value={defaultUnits}
              onChange={(e) => setDefaultUnits(e.target.value)}
              className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-4 text-[#ebdbb2] focus:outline-none focus:ring-2 focus:ring-[#fabd2f] focus:border-transparent appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23928374' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "12px",
              }}
            >
              <option value="metric">°C, м/с</option>
              <option value="imperial">°F, mph</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#fabd2f] hover:bg-[#fe8019] text-[#1d2021] font-semibold py-3 rounded-2xl transition disabled:opacity-50"
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#ebdbb2]/20"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#282828] px-2 text-[#928374]">Или</span>
          </div>
        </div>

        <button
          onClick={handleGitHub}
          className="w-full flex items-center justify-center gap-2 bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] py-3 rounded-2xl transition"
        >
          <FiGithub size={20} /> Зарегистрироваться через GitHub
        </button>

        <p className="text-center text-sm mt-4 text-[#928374]">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-[#fabd2f] hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
