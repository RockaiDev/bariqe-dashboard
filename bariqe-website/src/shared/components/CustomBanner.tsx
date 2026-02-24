'use client';

import {motion} from 'framer-motion'
import { fadeDown, fadeUp, fastFloat } from "@/shared/animations";
import { useLocale, useTranslations } from "next-intl";

import React from 'react'
import Image from 'next/image';


const Banner = () => {
  const t = useTranslations('homeBanner');
  return (
   <div className="relative overflow-hidden bg-[#FEEFBF] " >

          <motion.div
          initial={{
           y:-40
          }}
          whileInView={{y:0}}
         style={{ transformOrigin: "top" }}
  transition={{ duration: 0.4 }}
  viewport={{once:true}}
  className="absolute left-1/2 -translate-x-1/2 
             top-[-400px] rounded-full bg-primary 
             w-[530px] h-[530px]"
          />

          <motion.div 
          initial={{x:20}}
          whileInView={{x:0}}
          transition={{duration:.4}}
          viewport={{once:true}}
          className='hidden md:block'
          >

          <Image src={'/home-banner/home-flower.png'} width={250} height={250} alt='flower' 
          className='absolute top-0 right-0'
          />
          </motion.div>
        <div className="py-16 md:py-5 max-w-7xl   flex flex-col md:flex-row items-center justify-center mx-auto px-4 relative h-[528px] w-full">
         <motion.span
         style={{ willChange: "transform"}}
       variants={fastFloat}
       animate='animate'
         className="w-auto h-auto hidden md:block shrink-0"
         >

          <Image
            src={'/allProducts/right.svg'}
            alt="left"
            width={500}
            height={500}
            className='object-cover'
            
            />
            </motion.span>
         <motion.div
         variants={fadeUp}
         initial="initial"
         animate="animate"
         className='w-full  justify-end hidden'
         >

          <Image
            src={'/allProducts/left.png'}
            alt="left"
            width={180}
            height={180}
            
            
            />
            </motion.div>


          
          <motion.div
          variants={fadeDown}
          initial={'initial'}
          animate={'animate'}
          className="text-center  flex flex-col items-center justify-center gap-2">
           
            <h4 className="text-primary text-4xl md:text-5xl  md:w-xl mb-4 font-bold">{t('title')}</h4>
            <p className="text-gray-400 text-sm sm:text-xl font-semibold mb-4">{t('description')}</p>
            <BannerBtn 
            title={t('btn')}
            url='/all-products'
            />
          </motion.div>

 <motion.div
         style={{ willChange: "transform"}}
       variants={fastFloat}
       animate='animate'
          className="w-auto h-auto hidden md:block shrink-0"
         >

          <Image
            src={'/allProducts/left.png'}
            alt="left"
            width={500}
            height={500}
            className='object-cover'
           
            
            />
            </motion.div>


      
 <motion.div
         variants={fadeDown}
         initial="initial"
         animate="animate"
         className='w-full flex justify-start md:hidden absolute bottom-[-15] right-0'
         >

          <Image
            src={'/allProducts/right.png'}
            alt="left"
            width={180}
            height={180}
           
            
            />
            <Image src={'/home-banner/home-flower.png'} width={130} height={130} alt='flower' 
          className='absolute bottom-[-20px] right-[-10]'
          />
            </motion.div>


        </div>

      </div>
  )
}

export default Banner




import CustomButton from "@/shared/components/CustomButton"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useAnimation } from "framer-motion"
import { useRouter } from "@/i18n/routing"

const BannerBtn = ({title, url}:{title:string, url:string}) => {
     const controls = useAnimation()
  const router = useRouter();
  const local = useLocale()


  const handleMouseEnter = () => {

    controls.start({
      y: 0,
      opacity: 1,
      transition: { duration: .3 },

    })
  }

  const handleMouseLeave = () => {

    controls.start({
      y: 40,
      opacity: 0,
      transition: { duration: 1 },
    })
  }
  return (
    <motion.div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
       
      >
        <CustomButton
        onClick={()=>router.push(url)}
          className="relative shadow-[0px_1px_10px_5px_#CADCE6] hover:shadow-none 
          bg-primary text-white  overflow-hidden px-4 lg:px-9"

        >
          <p className="text-sm lg:text-lg">{title}</p>
          {local == 'en'?
          <ChevronRight className="w-4 h-4 lg:w-8 lg:h-8 ltr:block"/>
          :<ChevronLeft className="w-4 h-4 lg:w-8 lg:h-8 "/>
          }
          <motion.div
            className="absolute -bottom-2 -right-2  pointer-events-none"
            initial={{ y: 40, opacity: 0 }}
            animate={controls}
          >
            <Image src="/hero/ellips.png" width={45} height={45} alt="ellipse" />
          </motion.div>
        </CustomButton>
      </motion.div>
  )
}


