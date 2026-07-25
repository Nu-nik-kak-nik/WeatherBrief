export const getGradientByCondition = (condition) => {
  const cond = condition.toLowerCase();
  if (cond.includes("clear") || cond.includes("sun"))
    return "bg-gradient-sunny";
  if (cond.includes("rain")) return "bg-gradient-rainy";
  if (cond.includes("snow")) return "bg-gradient-snowy";
  if (cond.includes("cloud")) return "bg-gradient-cloudy";
  return "bg-gradient-night";
};
