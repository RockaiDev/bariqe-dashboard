import { Variants } from "framer-motion"

 export const fadeUp:Variants = {
  initial: {
    y: -30,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}
  export const fadeDown:Variants = {
  initial: {
    y: 20,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export const fastFloat:Variants = {
  animate: {
    y: ["0%", "-4%", "-6%", "-4%", "0%", "4%", "6%", "4%", "0%"],

    transition: {
      duration: 2,
      ease: [0.45, 0, 0.55, 1], 
      repeat: Infinity,
      repeatType:"loop"
    },
  },
}
