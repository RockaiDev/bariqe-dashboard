"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react"; // optional icon library
import { Button } from "@/shared/components/ui/button";

export default function ScrollUpButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page scrolls down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 200) setIsVisible(true);
      else setIsVisible(false);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Scroll smoothly to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed bottom-6 left-6 z-50   rounded-full transition-all duration-300 hover:scale-110 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      }`}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </Button>
  );
}

