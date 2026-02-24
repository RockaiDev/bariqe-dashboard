import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'

import { BadgePercent, Heart, Shield, Truck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import FadeUpReval from '@/shared/animations/FadUpReval'

const SpecialSection = () => {
  const t = useTranslations('specialSection');
  const specialSectionData = [
    {
      icon: <Heart className='text-destructive' />,
      title: t('card1.title'),
      description: t('card1.description'),
      bg: 'bg-destructive/20'
    },
    {
      icon: <BadgePercent className='text-secondary' />,
      title: t('card2.title'),
      description: t('card2.description'),
      bg: 'bg-secondary/20'
    },
    {
      icon: <Truck className='text-action-hover' />,
      title: t('card3.title'),
      description: t('card3.description'),
      bg: 'bg-action-hover/20'
    },
    {
      icon: <Shield className='text-success' />,
      title: t('card4.title'),
      description: t('card4.description'),
      bg: 'bg-success/20'
    }
  ];
  return (
    <section>
      <div className='max-w-7xl px-4 mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 py-[50px]'>
        {specialSectionData.map((item, index) => (
          <FadeUpReval className='h-full' key={index} delay={index * 0.1}>
            <SpecialCard
              icon={item.icon}
              bg={item.bg}
              title={item.title}
              description={item.description}
            />
          </FadeUpReval>
        ))}
      </div>
    </section>
  )
}

const SpecialCard = ({
  icon,
  title,
  description,
  bg
}: {
  icon: React.ReactNode
  title: string
  description: string
  bg: string
}) => {
  return (
    <Card className='h-full hover:shadow-lg transition-all duration-300 border-none shadow-sm dark:bg-card/50'>
      <CardContent className='flex flex-col items-center text-center p-6 gap-4 h-full'>
        <div className={`p-4 rounded-full ${bg} mb-2`}>
          {React.cloneElement(icon as React.ReactElement, { size: 28 })}
        </div>
        <h3 className='text-xl font-bold'>{title}</h3>
        <p className='text-muted-foreground leading-relaxed'>
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

export default SpecialSection

