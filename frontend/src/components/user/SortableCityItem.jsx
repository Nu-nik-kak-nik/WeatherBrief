import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiTrash2, FiMenu } from "react-icons/fi";

const SortableCityItem = ({ id, cityName, onClick, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-xl bg-[#1d2021] hover:bg-[#fabd2f]/10 transition cursor-pointer group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#928374] group-hover:text-[#fabd2f]"
      >
        <FiMenu size={18} />
      </div>
      <span onClick={onClick} className="flex-1 text-[#ebdbb2]">
        {cityName}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-[#928374] hover:text-[#fb4934] transition"
      >
        <FiTrash2 size={16} />
      </button>
    </li>
  );
};

export default SortableCityItem;
