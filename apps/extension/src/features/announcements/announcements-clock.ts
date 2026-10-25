import { useEffect, useState } from "react";

const CLOCK_INTERVAL_MS = 1_000;

export const useAnnouncementsClock = () => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), CLOCK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);
  return now;
};