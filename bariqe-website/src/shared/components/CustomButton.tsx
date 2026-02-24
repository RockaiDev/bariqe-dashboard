import * as React from "react";

type CustomButtonProps = {
  onClick?: () => void;
  type?: "button" | "submit" | "reset";

  disabled?: boolean,
  className?: string;
  children?: React.ReactNode;
  title?: string;
};

export default function CustomButton({

  onClick,
  type = "button",
  disabled,
  className = "",
  title,

  children }: CustomButtonProps) {
  return (
    <button
      disabled={disabled}
      type={type}
      onClick={onClick}
      title={title}

      className={`flex items-center justify-center gap-2 rounded-full  py-2.5 
         transition-all duration-200 active:scale-95 disabled:opacity-60 
         
         ${className}`}


    >
      {children}


    </button>
  );
}

