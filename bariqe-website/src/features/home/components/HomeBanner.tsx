import React from 'react'
import CustomBanner from '@/shared/components/CustomBanner'
import CustomButton from '@/shared/components/CustomButton'
import { ChevronLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

const HomeBanner = () => {
  const t = useTranslations('homeBanner');
  return (
    <CustomBanner  >
        
      </CustomBanner>
  )
}

export default HomeBanner
