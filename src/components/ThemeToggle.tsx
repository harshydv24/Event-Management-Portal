import { useState } from "react";
import { Moon } from "lucide-react";

const ThemeToggle = () => {
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = () => {
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="transition rounded-full w-9 h-9 p-0 flex items-center justify-center text-white bg-white/10 hover:bg-white/30 border border-white/30"
        title="Theme toggle"
      >
        <Moon className="w-4 h-4 p-0" />
      </button>

      {showPopup && (
        <div
          className="absolute right-0 top-full mt-2 px-4 py-2 bg-popover border border-border rounded-lg shadow-xl z-[100] whitespace-nowrap text-sm font-medium text-foreground"
          style={{ animation: 'notifSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          Coming Soon
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
