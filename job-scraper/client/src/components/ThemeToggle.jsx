import React from "react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      aria-pressed={theme === "dark"}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      onClick={toggleTheme}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span className="icon" aria-hidden="true">
        {theme === "light" ? (
          // Moon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="currentColor"
              opacity="0.85"
            />
          </svg>
        ) : (
          // Sun
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4.5" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2v3" />
              <path d="M12 19v3" />
              <path d="M2 12h3" />
              <path d="M19 12h3" />
              <path d="M4.22 4.22l2.12 2.12" />
              <path d="M17.66 17.66l2.12 2.12" />
              <path d="M19.78 4.22l-2.12 2.12" />
              <path d="M6.34 17.66l-2.12 2.12" />
            </g>
          </svg>
        )}
      </span>
      <span className="label">{theme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
}
