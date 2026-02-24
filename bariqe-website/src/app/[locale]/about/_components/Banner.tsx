'use client';

import {motion} from 'framer-motion'
import { fadeDown, fadeUp } from "@/shared/animations";
import { useTranslations } from "next-intl";

import React from 'react'
import Image from 'next/image';
import { Badge } from '@/shared/components/ui/badge';

const Banner = () => {
  const t = useTranslations('aboutPage.banner');
  return (
   <div className="py-5  " style={{ backgroundImage: 'url(/about/about-hero.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="max-w-7xl flex flex-col md:flex-row items-center justify-center mx-auto  relative  min-h-[550px] md:h-[500px] w-full">
         <motion.div
         variants={fadeUp}
         initial="initial"
         animate="animate"
         className="hidden md:block shrink-0"
         >

          <Image
            src={'/allProducts/right.png'}
            alt="left"
            width={500}
            height={500}
            
            
            />
            </motion.div>
         <motion.div
         variants={fadeUp}
         initial="initial"
         animate="animate"
         className='w-full flex justify-end items-start md:hidden'
         >

          <Image
            src={'/allProducts/left.png'}
            alt="left"
            width={250}
            height={250}
            
            
            />
            </motion.div>


          
          <motion.div
          variants={fadeDown}
          initial={'initial'}
          animate={'animate'}
          className="text-center px-5">
            <Badge className= 'mb-5 bg-secondary rounded-full text-primary'>{t('badge')}</Badge>
            <h4 className="text-white md:w-xl text-5xl md:text-6xl ltr:text-4xl mb-4 font-bold">{t('title')}</h4>
            <p className="text-gray-400 text-sm md:text-lg">{t('description')}</p>
          </motion.div>

 <motion.div
         variants={fadeUp}
         initial="initial"
         animate="animate"
          className="hidden md:block shrink-0"
         >

          <Image
            src={'/allProducts/left.png'}
            alt="left"
            width={500}
            height={500}
           
            
            />
            </motion.div>


      
 <motion.div
         variants={fadeDown}
         initial="initial"
         animate="animate"
         className='w-full flex justify-start md:hidden'
         >

          <Image
            src={'/allProducts/right.png'}
            alt="left"
            width={250}
            height={250}
           
            
            />
            </motion.div>


        </div>

      </div>
  )
}

export default Banner