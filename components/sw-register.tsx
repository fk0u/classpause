"use client";
import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && (process.env.NODE_ENV === "production" || location.hostname === "localhost")) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
