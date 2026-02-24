import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MoveToBottom, MoveToTop } from '../animations/index';

import logo from "@/assets/logo.svg";
const ErrorPage: FC = () => {


  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <figure className="shrink-0 w-full max-w-screen-sm">
        <blockquote>
          <Link
            to="/"
            className="table mb-8 mx-auto"
          >
            <motion.img
              animate="visible"
              initial="hidden"
              variants={MoveToTop}
              src={logo}
              alt="error image"
              className="w-full max-w-md"
            />
          </Link>
          {/* <p className="text-6xl text-neutral-800 font-bold text-center">404</p> */}
          <motion.p
            animate="visible"
            initial="hidden"
            variants={MoveToBottom}
            className="text-lg text-neutral-500 font-medium mb-8 mt-2 text-center"
          >
            It seems that you are lost or that the required page was not found. Please re-check the
            entered link to go to the required page or return to the main page.
          </motion.p>
        </blockquote>
      </figure>
    </div>
  );
};

export default ErrorPage;
