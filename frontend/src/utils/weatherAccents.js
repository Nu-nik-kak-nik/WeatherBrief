const accents = {
  sunny: { border: "#fabd2f", glow: "0 0 12px #fabd2f", icon: "#fabd2f" },
  rainy: { border: "#83a598", glow: "0 0 12px #83a598", icon: "#83a598" },
  snowy: { border: "#8ec07c", glow: "0 0 12px #8ec07c", icon: "#8ec07c" },
  cloudy: { border: "#928374", glow: "0 0 8px #928374", icon: "#fabd2f" },
  night: { border: "#fe8019", glow: "0 0 12px #fe8019", icon: "#fe8019" },
  default: { border: "#ebdbb2", glow: "none", icon: "#ebdbb2" },
};

export function getWeatherAccent(condition, isDay = true) {
  const cond = condition.toLowerCase();
  if (!isDay) return accents.night;
  if (cond.includes("clear") || cond.includes("sun")) return accents.sunny;
  if (cond.includes("rain")) return accents.rainy;
  if (cond.includes("snow")) return accents.snowy;
  if (cond.includes("cloud")) return accents.cloudy;
  return accents.default;
}
