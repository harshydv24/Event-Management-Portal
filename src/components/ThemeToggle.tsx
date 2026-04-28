import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    // Render placeholder with same dimensions to prevent layout shift
    return (
      <button
        className="rounded-full w-9 h-9 p-0 flex items-center justify-center surface-translucent-2 border border-standard"
        aria-label="Toggle theme"
      >
        <Sun className="w-4 h-4 opacity-50" />
      </button>
    );
  }

  // Show the opposite icon: Sun when dark (click to go light), Moon when light (click to go dark)
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full w-9 h-9 p-0 flex items-center justify-center
        surface-translucent-2 border border-standard
        text-foreground/80 hover:text-foreground
        hover:surface-translucent-3
        transition-all duration-200 cursor-pointer"
      title={label}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

export default ThemeToggle;
