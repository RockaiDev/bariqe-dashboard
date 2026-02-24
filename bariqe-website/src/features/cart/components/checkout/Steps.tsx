"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

interface StepItem {
  title: string;
}

interface StepsProps {
  steps: StepItem[];
  currentStep: number;
  onStepChange?: (index: number) => void;
  direction?: "rtl" | "ltr"; // Optional: force direction
}

export function Steps({
  steps,
  currentStep,
  onStepChange,
  direction,
}: StepsProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4 w-full",
        direction === "rtl" && "rtl",
        direction === "ltr" && "ltr"
      )}
      dir={direction}
    >
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div
            key={index}
            className="flex-1 flex flex-col items-center relative"
          >
            {/* Circle */}
            <motion.div
              onClick={() => onStepChange && onStepChange(index)}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all z-10",
                isActive &&
                "border border-success bg-muted text-success shadow-lg",
                isCompleted && "bg-success text-white",
                !isActive &&
                !isCompleted &&
                "bg-muted text-muted-foreground"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {index + 1}
            </motion.div>

            {/* Title */}
            <p
              className={clsx(
                "body-meduim absolute -bottom-6",
                "text-center",
                isCompleted
                  ? "text-text-secondary-2"
                  : "text-text-secondary"
              )}
            >
              {step.title}
            </p>

            {/* Line */}
            {index < steps.length - 1 && (
              <div
                className={clsx(
                  "h-0.5 absolute w-[75%] bottom-1/2 z-0",
                  // LTR → line goes right
                  // RTL → line goes left
                  "ltr:left-1/2 rtl:right-1/2",

                  isCompleted ? "bg-success" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
