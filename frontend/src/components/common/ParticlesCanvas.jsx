import React, { useEffect, useRef } from "react";
import { useWeather } from "../../hooks/useWeather";

const ParticlesCanvas = () => {
  const canvasRef = useRef(null);
  const { weather } = useWeather();
  const condition = weather?.condition || "";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];

    const isRain = condition.toLowerCase().includes("rain");
    const isSnow = condition.toLowerCase().includes("snow");
    if (!isRain && !isSnow) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const PARTICLE_COUNT = 150;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speedY: 2 + Math.random() * 5,
        speedX: isRain ? Math.random() * 1 - 0.5 : 0,
        radius: isSnow ? 2 + Math.random() * 3 : 1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isRain
        ? "rgba(173,216,230,0.6)"
        : "rgba(255,255,255,0.8)";
      particles.forEach((p) => {
        ctx.beginPath();
        if (isSnow) {
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        } else {
          ctx.rect(p.x, p.y, 1.5, 6);
        }
        ctx.fill();
      });
    };

    const update = () => {
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y > canvas.height) p.y = 0;
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
      });
    };

    const animate = () => {
      update();
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [condition]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default ParticlesCanvas;
