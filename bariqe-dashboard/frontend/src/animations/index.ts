import type { Variants } from 'framer-motion';

export const MoveToTop: Variants = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 1, y: 15, transition: { duration: 1, delay: 0.2 } }
};

export const MoveToBottom: Variants = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 1, y: -15, transition: { duration: 1, delay: 0.2 } }
};
