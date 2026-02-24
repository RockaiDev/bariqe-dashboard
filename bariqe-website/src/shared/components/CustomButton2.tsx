"use client"
import Image from "next/image"

import CustomButton from "@/shared/components/CustomButton"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, useAnimation } from "framer-motion"
import { useRouter } from "@/i18n/routing"
import { useLocale } from "next-intl"

const CustomButton2 = ({ title, url }: { title: string, url: string }) => {
  const controls = useAnimation()
  const router = useRouter();
  const locale = useLocale();


  const handleMouseEnter = () => {

    controls.start({
      y: 0,
      opacity: 1,
      transition: { duration: .8 },

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
        onClick={() => router.push(url)}
        className="relative shadow-[0px_1px_10px_5px_#CADCE6] hover:shadow-none 
          bg-background text-action ltr:flex-row-reverse hover:text-action-hover overflow-hidden px-4 lg:px-9"

      >
        <p className="text-sm lg:text-lg">{title}</p>
        {locale === 'en' ?

          <ChevronRight className="w-4 h-4 lg:w-8 lg:h-8 " /> :
          <ChevronLeft className="w-4 h-4 lg:w-8 lg:h-8 " />
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

export default CustomButton2
