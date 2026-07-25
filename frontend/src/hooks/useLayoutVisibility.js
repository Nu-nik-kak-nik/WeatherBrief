import { useState, useEffect } from "react";

const STORAGE_KEY = "layout_visibility";

const defaultVisibility = {
  showForecast: true,
  showMap: true,
};

export const useLayoutVisibility = () => {
  const [visibility, setVisibility] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultVisibility, ...JSON.parse(saved) };
      } catch (e) {
        return defaultVisibility;
      }
    }
    return defaultVisibility;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  }, [visibility]);

  const toggleVisibility = (key) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return { visibility, toggleVisibility };
};
