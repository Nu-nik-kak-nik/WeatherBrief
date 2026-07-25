import React from "react";
import { FiMenu, FiX } from "react-icons/fi";

const BurgerMenu = ({ isOpen, toggle }) => {
  return (
    <button
      onClick={toggle}
      className="fixed top-4 left-4 z-50 p-2 rounded-full glass-card md:hidden"
      aria-label="Menu"
    >
      {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
    </button>
  );
};

export default BurgerMenu;
