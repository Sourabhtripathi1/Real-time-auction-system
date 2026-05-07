import { useState, useEffect, useRef } from "react";

const calculateTimeLeft = (endTime) => {
  const diff = new Date(endTime).getTime() - Date.now();

  if (diff <= 0) {
    return { 
      days: 0, hours: 0, minutes: 0, seconds: 0, 
      isExpired: true,
      isEndingSoon: false,
      isCritical: false,
      isUltraCritical: false
    };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
    isEndingSoon: diff <= 5 * 60 * 1000,
    isCritical: diff <= 1 * 60 * 1000,
    isUltraCritical: diff <= 10 * 1000,
  };
};

const useCountdown = (endTime) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endTime));
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!endTime) return;

    // Recalculate immediately when endTime changes (anti-snipe)
    setTimeLeft(calculateTimeLeft(endTime));

    intervalRef.current = setInterval(() => {
      const next = calculateTimeLeft(endTime);
      setTimeLeft(next);
      if (next.isExpired) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [endTime]); // re-runs when endTime changes

  return timeLeft;
};

export default useCountdown;
