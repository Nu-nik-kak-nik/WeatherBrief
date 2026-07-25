import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FiMenu, FiLogOut } from "react-icons/fi";

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-[#282828]/80 backdrop-blur-sm rounded-2xl border border-[#ebdbb2]/20 px-4 py-3 flex justify-between items-center">
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 text-[#ebdbb2] hover:bg-[#fabd2f]/20 rounded-full transition"
      >
        <FiMenu size={24} />
      </button>
      <div className="flex-1 text-center md:text-left">
        <span className="text-xl font-bold text-[#ebdbb2]">Weather Brief</span>
      </div>
      <div>
        {user ? (
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-800/50 hover:bg-red-800 text-[#ebdbb2] px-3 py-1 rounded-full transition"
          >
            <FiLogOut size={18} /> Выйти
          </button>
        ) : (
          <Link
            to="/login"
            className="bg-[#fabd2f] hover:bg-[#fe8019] text-[#1d2021] px-4 py-1.5 rounded-full transition"
          >
            Войти
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
