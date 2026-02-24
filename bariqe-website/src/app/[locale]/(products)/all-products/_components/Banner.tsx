'use client';
import { useTranslations } from "next-intl";
import Image from "next/image";

import { motion, Variants } from "framer-motion";
import { fadeDown, fadeUp } from "@/shared/animations";


const Banner = () => {
    const t = useTranslations('allProducts');
  return (
   <div className="py-0.5 hidden sm:block " style={{ backgroundImage: 'url(/allProducts/all-product-banner.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="max-w-7xl  flex flex-col md:flex-row items-center justify-center mx-auto px-4 relative  h-[454px]  md:h-[500px] w-full">
         <motion.div
         variants={fadeUp}
         initial="initial"
         animate="animate"
         className="w-auto h-auto shrink-0"
         >

          <Image
            src={'/allProducts/right.png'}
            alt="left"
            width={500}
            height={500}
            className="hidden md:block object-cover"
            
            
            />
            </motion.div>
          <motion.div 
          variants={fadeUp}
          initial={"initial"}
          animate={"animate"}

      
          className="md:hidden w-full md:w-fit flex justify-center items-start">

            <Image
              src={'/allProducts/right.png'}
              alt="left"
              width={200}
              height={200}
              

            />
            <Image
              src={'/allProducts/left.png'}
              alt="left"
              width={200}
              height={200}


            />
          </motion.div>
          <motion.div
          variants={fadeDown}
          initial={'initial'}
          animate={'animate'}
          className="text-center ">

            <h4 className="text-white  md:w-xl text-5xl md:text-6xl mb-4 font-bold">{t('title')}</h4>
            <p className="text-gray-400 text-lg">{t('description')}</p>
          </motion.div>

 <motion.div
         variants={fadeUp}
         initial="initial"
         animate="animate"
           className="w-auto h-auto shrink-0"
         >

          <Image
            src={'/allProducts/left.png'}
            alt="left"
            width={500}
            height={500}
            className="hidden md:block"
            
            />
            </motion.div>


        </div>

      </div>
  )
}

export default Banner