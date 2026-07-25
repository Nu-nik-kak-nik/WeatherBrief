import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiGithub,
  FiArrowLeft,
} from "react-icons/fi";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, githubLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Неверный email или пароль");
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
          Вход
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
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
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#fabd2f] hover:bg-[#fe8019] text-[#1d2021] font-semibold py-3 rounded-2xl transition"
          >
            Войти
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
          <FiGithub size={20} /> Войти через GitHub
        </button>

        <p className="text-center text-sm mt-4 text-[#928374]">
          Нет аккаунта?{" "}
          <Link to="/register" className="text-[#fabd2f] hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
