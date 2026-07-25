import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CurrentWeatherCard from "../weather/CurrentWeatherCard";
import Forecast5Days from "../weather/Forecast5Days";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useLayoutVisibility } from "../../hooks/useLayoutVisibility";
import { WeatherCharts } from "../weather/WeatherCharts";
import { useSettings } from "../../hooks/useSettings";
import MapView from "../weather/MapView";

const Layout = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { visibility } = useLayoutVisibility();
  const { showGraphs } = useSettings();

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-[#1d2021] p-3 overflow-x-hidden">
        <div className="grid grid-cols-[280px_1fr] gap-5">
          <Sidebar isMobileOpen={false} onClose={() => {}} />
          <div className="flex flex-col gap-6">
            <Header toggleSidebar={() => {}} />
            <main className="space-y-6 max-w-full min-w-0 mx-auto">
              <CurrentWeatherCard />
              {visibility.showForecast && <Forecast5Days />}
              {showGraphs && <WeatherCharts />}
              {visibility.showMap && <MapView />}
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1d2021]">
      <Header toggleSidebar={() => setSidebarOpen(true)} />
      <main className="p-4 space-y-6">
        <CurrentWeatherCard />
        {visibility.showForecast && <Forecast5Days />}
        {showGraphs && <WeatherCharts />}
        {visibility.showMap && <MapView />}
      </main>
      <Sidebar
        isMobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
};

export default Layout;
