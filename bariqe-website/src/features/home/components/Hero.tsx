"use client"

import Image from "next/image"

import CustomButton from "@/shared/components/CustomButton"
import { ChevronLeft } from "lucide-react"
import { motion, useAnimation } from "framer-motion"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import CustomButton2 from "@/shared/components/CustomButton2"


const heroData = [
  '/hero/hero.svg',
 

]

const Hero = () => {
  const controls = useAnimation()
  const router = useRouter();
  const t = useTranslations('hero');
const locale = useLocale();

  return (
    <section dir={locale == 'en'?'rtl':'ltr'} className="   relative min-h-[590px] w-full flex flex-col lg:flex-row lg:justify-around items-center" style={{backgroundImage:'url(/hero/desk-hero.png)', backgroundSize:'cover', backgroundPosition:'center',

    }}>
    <div className="relative w-[660px] max-w-full max-h-[660px]">
  
  {/* الصورة الأساسية */}
  <Image 
    src="/hero/left.png" 
    width={660} 
    height={320} 
    alt="left"
    className="w-full h-auto"
  />

  {/* الصورة اللي فوقها (Responsive) */}
  <div className="absolute left-1/2 lg:left-70 bottom-15 lg:bottom-20 -translate-x-1/2 w-[30%] md:w-[25%] lg:w-[25%]">
    <Image
      src="/hero/bubbles.gif"
      alt="bubbles"
      width={500}
      height={500}
      className="w-full h-auto"
    />
  </div>

</div>
      <div className=" flex flex-col items-end gap-2 lg:mx-20 pb-10 px-6">
                <p className="text-[#CBD5E1] text-sm sm:text-lg text-end">{t('subtitle')}</p>
        <p className={`text-3xl ${locale === "en" ?'lg:text-5xl lg:leading-[52px]': 'lg:text-6xl lg:leading-[72px]'} font-bold text-white max-w-xl text-end`}>
          {t('specialOffer') } <span className="text-secondary">{t('logo')}</span>
        </p>
        <p className="text-[#CBD5E1] text-sm sm:text-lg text-end mb-4">{t('tagline')}</p>
     <CustomButton2 title={t('btn') } url={'/all-products'}/>
    
      </div>
     
     
      
      </section>


  )
}

export default Hero
