"use client";

import { useEffect, useState } from "react";

const TARGET_DATE = new Date("2025-07-05T00:00:00");

function calculateTimeLeft() {
  const difference = TARGET_DATE.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export function Countdown() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-4 gap-4 text-center">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-4xl font-bold">--</span>
            <span className="text-sm text-neutral-400">
              {i === 0 ? "天" : i === 1 ? "时" : i === 2 ? "分" : "秒"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 text-center">
      <div className="flex flex-col">
        <span className="text-4xl font-bold">{timeLeft.days}</span>
        <span className="text-sm text-neutral-400">天</span>
      </div>
      <div className="flex flex-col">
        <span className="text-4xl font-bold">{timeLeft.hours}</span>
        <span className="text-sm text-neutral-400">时</span>
      </div>
      <div className="flex flex-col">
        <span className="text-4xl font-bold">{timeLeft.minutes}</span>
        <span className="text-sm text-neutral-400">分</span>
      </div>
      <div className="flex flex-col">
        <span className="text-4xl font-bold">{timeLeft.seconds}</span>
        <span className="text-sm text-neutral-400">秒</span>
      </div>
    </div>
  );
} 