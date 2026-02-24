import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import FadeUpReval from "@/shared/animations/FadUpReval";
import { fastFloat } from "@/shared/animations";

const SecurityIcons = () => {
  return (
    <FadeUpReval className="relative h-32 w-full flex items-center justify-center mb-6" delay={0.2} duration={0.8}>
      <motion.div variants={fastFloat} animate="animate">
        <Image
          src={'/cuate.png'}
          alt="cuate"
          width={150}
          height={150}
        />
      </motion.div>
    </FadeUpReval>
  );
};

export default SecurityIcons;

