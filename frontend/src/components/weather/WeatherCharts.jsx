import React, { useMemo, useState, useRef, useCallback } from "react";
import { useWeather } from "../../hooks/useWeather";
import { useSettings } from "../../hooks/useSettings";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  Bar,
} from "recharts";
import { FiLock, FiUnlock } from "react-icons/fi";
import { throttle } from "lodash";
import { getTemperatureUnit, getWindUnit } from "../../utils/unitConverter";

const METRICS = {
  temp: {
    label: "Температура",
    color: "#fabd2f",
    type: "line",
    dataKey: "temperature",
  },
  rain: {
    label: "Осадки",
    unit: "мм",
    color: "#83a598",
    type: "bar",
    dataKey: "total_precip_mm",
  },
  wind: {
    label: "Ветер",
    color: "#8ec07c",
    type: "line",
    dataKey: "wind_speed",
  },
  pressure: {
    label: "Давление",
    unit: "гПа",
    color: "#d3869b",
    type: "line",
    dataKey: "pressure_hpa",
  },
  humidity: {
    label: "Влажность",
    unit: "%",
    color: "#fe8019",
    type: "line",
    dataKey: "humidity_pct",
  },
};

const getUnit = (metricKey, units) => {
  if (metricKey === "temp") return getTemperatureUnit(units);
  if (metricKey === "wind") return getWindUnit(units);
  if (metricKey === "pressure") return "гПа";
  return METRICS[metricKey].unit;
};

const ChartView = React.forwardRef(({ data, metric, units, onScroll }, ref) => {
  const config = METRICS[metric];
  const yAxisUnit = getUnit(metric, units);
  const internalRef = useRef(null);
  const containerRef = ref || internalRef;

  const handleScroll = useCallback(
    throttle((e) => {
      if (onScroll) onScroll(e.target.scrollLeft);
    }, 16),
    [onScroll],
  );

  if (!data.length) {
    return (
      <div className="bg-[#282828] rounded-2xl p-5 text-center text-[#928374]">
        Нет данных для графика
      </div>
    );
  }

  return (
    <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 p-4 shadow-none">
      <div className="mb-2 flex justify-between items-center">
        <h4 className="text-sm font-medium text-[#ebdbb2]">{config.label}</h4>
        <span className="text-xs text-[#928374]">{yAxisUnit}</span>
      </div>
      <div className="w-full overflow-hidden">
        <div
          ref={containerRef}
          className="overflow-x-auto"
          onScroll={handleScroll}
        >
          <div style={{ width: `${data.length * 70}px`, height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#928374"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="timeLabel"
                  tick={{ fill: "#ebdbb2", fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: "#ebdbb2", fontSize: 11 }}
                  unit={yAxisUnit}
                  width={65}
                  domain={["auto", "auto"]}
                  allowDecimals={metric !== "pressure"}
                  tickFormatter={(value) => Number(value).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#282828",
                    borderColor: "#ebdbb2/20",
                    color: "#ebdbb2",
                  }}
                  labelStyle={{ color: "#fabd2f" }}
                  formatter={(value) => {
                    const formatted = Number(value).toFixed(2);
                    return [`${formatted} ${yAxisUnit}`, config.label];
                  }}
                />
                <Legend wrapperStyle={{ color: "#ebdbb2" }} />
                {config.type === "line" ? (
                  <Line
                    name={config.label}
                    type="monotone"
                    dataKey={config.dataKey}
                    stroke={config.color}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    isAnimationActive={false}
                  />
                ) : (
                  <Bar
                    name={config.label}
                    dataKey={config.dataKey}
                    fill={config.color}
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
});

export const WeatherCharts = () => {
  const { hourlyForecast } = useWeather();
  const { units, chartMode, syncCharts, setChartMode, setSyncCharts } =
    useSettings();
  const [selectedMetric1, setSelectedMetric1] = useState("temp");
  const [selectedMetric2, setSelectedMetric2] = useState("rain");
  const [syncEnabled, setSyncEnabled] = useState(syncCharts);
  const ref1 = useRef(null);
  const ref2 = useRef(null);

  const chartData = useMemo(() => {
    if (!hourlyForecast.length) return [];
    return hourlyForecast.map((item) => ({
      ...item,
      timeLabel: new Date(item.dt_local).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      temperature: item.temperature,
      total_precip_mm:
        (item.precipitation?.rain_mm ?? 0) + (item.precipitation?.snow_mm ?? 0),
      wind_speed: Number(item.wind?.speed) || 0,
      pressure_hpa: item.pressure_hpa,
      humidity_pct: item.humidity_pct,
    }));
  }, [hourlyForecast]);

  const handleScroll1 = useCallback(
    (scrollLeft) => {
      if (syncEnabled && ref2.current) ref2.current.scrollLeft = scrollLeft;
    },
    [syncEnabled],
  );

  const handleScroll2 = useCallback(
    (scrollLeft) => {
      if (syncEnabled && ref1.current) ref1.current.scrollLeft = scrollLeft;
    },
    [syncEnabled],
  );

  const toggleSync = () => {
    const newState = !syncEnabled;
    setSyncEnabled(newState);
    setSyncCharts(newState);
  };

  if (!hourlyForecast.length) {
    return (
      <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 p-5 text-center">
        <p className="text-[#928374]">Почасовые данные отсутствуют</p>
      </div>
    );
  }

  if (chartMode === "single") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {Object.entries(METRICS).map(([key, conf]) => (
              <button
                key={key}
                onClick={() => setSelectedMetric1(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedMetric1 === key ? "bg-[#fabd2f] text-[#1d2021] shadow-md" : "bg-[#1d2021] text-[#ebdbb2] hover:bg-[#3c3836] border border-[#ebdbb2]/20"}`}
              >
                {conf.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setChartMode("double")}
            className="px-3 py-1.5 rounded-full text-sm bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] transition-colors"
          >
            Два графика
          </button>
        </div>
        <ChartView data={chartData} metric={selectedMetric1} units={units} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setChartMode("single")}
            className="px-3 py-1.5 rounded-full text-sm bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] transition-colors"
          >
            Один график
          </button>
          <button
            onClick={toggleSync}
            className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors ${syncEnabled ? "bg-[#fabd2f] text-[#1d2021]" : "bg-[#1d2021] text-[#ebdbb2] border border-[#ebdbb2]/20"}`}
          >
            {syncEnabled ? <FiLock size={14} /> : <FiUnlock size={14} />}
            {syncEnabled ? "Синхр. вкл" : "Синхр. выкл"}
          </button>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(METRICS).map(([key, conf]) => (
            <button
              key={key}
              onClick={() => setSelectedMetric1(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedMetric1 === key ? "bg-[#fabd2f] text-[#1d2021] shadow-md" : "bg-[#1d2021] text-[#ebdbb2] hover:bg-[#3c3836] border border-[#ebdbb2]/20"}`}
            >
              {conf.label}
            </button>
          ))}
        </div>
        <ChartView
          ref={ref1}
          data={chartData}
          metric={selectedMetric1}
          units={units}
          onScroll={handleScroll1}
        />
      </div>

      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(METRICS).map(([key, conf]) => (
            <button
              key={key}
              onClick={() => setSelectedMetric2(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedMetric2 === key ? "bg-[#fabd2f] text-[#1d2021] shadow-md" : "bg-[#1d2021] text-[#ebdbb2] hover:bg-[#3c3836] border border-[#ebdbb2]/20"}`}
            >
              {conf.label}
            </button>
          ))}
        </div>
        <ChartView
          ref={ref2}
          data={chartData}
          metric={selectedMetric2}
          units={units}
          onScroll={handleScroll2}
        />
      </div>
    </div>
  );
};
