"use client";

export function BuiltByBadge({ inline = false }: { inline?: boolean }) {
  return (
    <a
      href="https://teamtech.rs"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: inline ? "relative" : "fixed",
        ...(inline ? {} : { right: "20px", bottom: "20px" }),
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#42444a",
        border: "1px solid rgba(233, 176, 53, 0.25)",
        borderRadius: "6px",
        padding: "7px 13px",
        fontFamily: "Montserrat, system-ui, sans-serif",
        textDecoration: "none",
        zIndex: 9999,
        opacity: 0.75,
        transition: "opacity 0.2s ease, border-color 0.2s ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
        (e.currentTarget as HTMLAnchorElement).style.borderColor =
          "rgba(233, 176, 53, 0.6)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.opacity = "0.75";
        (e.currentTarget as HTMLAnchorElement).style.borderColor =
          "rgba(233, 176, 53, 0.25)";
      }}
    >
      <span
        style={{
          fontSize: "9px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#999999",
          fontWeight: 500,
        }}
      >
        Built by
      </span>
      <span
        style={{
          fontSize: "11px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#e9b035",
          fontWeight: 700,
        }}
      >
        teamtech.rs
      </span>
    </a>
  );
}
