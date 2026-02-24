"use client";

import React from "react";
import { motion } from "framer-motion";

type FadeUpRevalProps = {
  children: React.ReactNode;
  /** Delay in seconds */
  delay?: number;
  /** Duration in seconds */
  duration?: number;
  /** Animate only the first time it comes into view */
  once?: boolean;
  /** Additional className for wrapper */
  className?: string;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection observer */
  threshold?: number | number[];
};

/**
 * Simple fade-up reveal wrapper using IntersectionObserver.
 * No external dependencies.
 */
export default function FadeUpReval({
  children,
  delay = 0,
  duration = 0.6,
  once = true,
  className = "",
  rootMargin = "0px 0px -10% 0px",
  threshold = 0.1,
}: FadeUpRevalProps) {
  // threshold is kept for API compatibility; framer-motion uses `amount` (0..1)
  const amount = typeof threshold === "number" ? threshold : 0.1;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once, amount, margin: rootMargin }}
    >
      {children}
    </motion.div>
  );
}

