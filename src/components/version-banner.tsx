"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function VersionBanner() {
  const [show, setShow] = useState(false);
  const initialVersion = useRef<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const data = await res.json();
        const v = data.version as string;

        if (!initialVersion.current) {
          initialVersion.current = v;
        } else if (v !== initialVersion.current) {
          setShow(true);
        }
      } catch {
        // ignore network errors silently
      }
    };

    fetchVersion();
    const id = setInterval(fetchVersion, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        backgroundColor: "#e9b035",
        color: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "10px 16px",
        fontSize: "13px",
        fontWeight: 600,
        fontFamily: "Montserrat, system-ui, sans-serif",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}
    >
      <RefreshCw size={15} />
      <span>Dostupna je nova verzija aplikacije.</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: "#1a1a1a",
          color: "#e9b035",
          border: "none",
          borderRadius: "4px",
          padding: "4px 12px",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Osvježi
      </button>
      <button
        onClick={() => setShow(false)}
        style={{
          position: "absolute",
          right: "12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#1a1a1a",
          display: "flex",
          alignItems: "center",
        }}
        aria-label="Zatvori"
      >
        <X size={15} />
      </button>
    </div>
  );
}
