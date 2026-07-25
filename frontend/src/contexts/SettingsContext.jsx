import React, { createContext, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateProfile } from "../services/api/user";

const getInitialUnits = () => localStorage.getItem("units") || "metric";
const getInitialLanguage = () => localStorage.getItem("language") || "ru";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [language, setLanguage] = useState(getInitialLanguage);
  const [units, setUnits] = useState(getInitialUnits);
  const [chartMode, setChartMode] = useState(
    () => localStorage.getItem("chartMode") || "single",
  );
  const [chartMetricsOrder, setChartMetricsOrder] = useState(() => {
    const saved = localStorage.getItem("chartMetricsOrder");
    return saved
      ? JSON.parse(saved)
      : ["temp", "rain", "wind", "pressure", "humidity"];
  });
  const [syncCharts, setSyncCharts] = useState(
    () => localStorage.getItem("syncCharts") !== "false",
  );
  const [showGraphs, setShowGraphs] = useState(
    () => localStorage.getItem("showGraphs") !== "false",
  );

  useEffect(() => {
    if (user?.settings) {
      const { preferred_lang, default_units } = user.settings;
      if (preferred_lang && preferred_lang !== language) {
        setLanguage(preferred_lang);
        localStorage.setItem("language", preferred_lang);
      }
      if (default_units && default_units !== units) {
        setUnits(default_units);
        localStorage.setItem("units", default_units);
      }
    }
  }, [user]);

  const handleSetLanguage = async (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    if (user) {
      try {
        await updateProfile({ preferred_lang: lang });
        if (refreshUser) await refreshUser();
      } catch (err) {
        console.error("Failed to update language:", err);
      }
    }
  };

  const handleSetUnits = async (unit) => {
    setUnits(unit);
    localStorage.setItem("units", unit);
    if (user) {
      try {
        await updateProfile({ default_units: unit });
        if (refreshUser) await refreshUser();
      } catch (err) {
        console.error("Failed to update units:", err);
      }
    }
  };

  const handleSetChartMode = (mode) => {
    setChartMode(mode);
    localStorage.setItem("chartMode", mode);
  };

  const handleSetChartMetricsOrder = (order) => {
    setChartMetricsOrder(order);
    localStorage.setItem("chartMetricsOrder", JSON.stringify(order));
  };

  const handleSetSyncCharts = (enabled) => {
    setSyncCharts(enabled);
    localStorage.setItem("syncCharts", enabled);
  };

  const handleSetShowGraphs = (enabled) => {
    setShowGraphs(enabled);
    localStorage.setItem("showGraphs", enabled);
  };

  return (
    <SettingsContext.Provider
      value={{
        language,
        units,
        chartMode,
        chartMetricsOrder,
        syncCharts,
        showGraphs,
        setLanguage: handleSetLanguage,
        setUnits: handleSetUnits,
        setChartMode: handleSetChartMode,
        setChartMetricsOrder: handleSetChartMetricsOrder,
        setSyncCharts: handleSetSyncCharts,
        setShowGraphs: handleSetShowGraphs,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
