"use client"

import React from 'react'
import { Link } from '@/i18n/routing'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { CarouselItem } from '@/shared/components/ui/carousel'
import CustomCarousel from '@/features/home/components/shared/CustomCarusol'
import ProductCard from './ProductCard'
import { Product } from '@/shared/types'

interface CustomProductsCarouselProps {
  title: string
  description?: string
  buttonExist?: boolean
  buttonLink?: string
  buttonLabel?: string
  products?: Product[]
  children?: React.ReactNode
  autoplay?: boolean
  autoplayDelay?: number
  autoscrol?: boolean
  autoScrollSpeed?: number
  align?: "start" | "center" | "end"
  loop?: boolean
  showArrows?: boolean
}

const CustomProductsCarousel = ({
  title,
  description = "",
  buttonExist,
  buttonLink,
  buttonLabel,
  products,
  children,
  autoplay,
  autoplayDelay,
  autoscrol,
  autoScrollSpeed,
  align,
  loop,
  showArrows
}: CustomProductsCarouselProps) => {
  return (
    <section className="w-full max-w-[1440px] mx-auto py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <SectionHeader
        title={title}
        description={description}
        buttonExist={buttonExist}
        buttonLink={buttonLink}
        buttonLabel={buttonLabel}
      />

      <div className="mt-8 w-full relative">
        <CustomCarousel
          autoplay={autoplay}
          autoplayDelay={autoplayDelay}
          autoscrol={autoscrol}
          autoScrollSpeed={autoScrollSpeed}
          align={align}
          loop={loop}
          showArrows={showArrows}
          ClassName="bg-white/90 text-primary hover:bg-primary hover:text-white border border-primary/10 shadow-lg size-10 sm:size-12 transition-all duration-300 backdrop-blur-sm"
        >
          {children ? children :
            products && products.map((product) => (
              <CarouselItem
                key={product._id}
                className="ps-1 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4  py-2"
              >
                <div className="h-full p-1">
                  <ProductCard product={product} />
                </div>
              </CarouselItem>
            ))
          }
        </CustomCarousel>
      </div>
    </section>
  )
}

const SectionHeader = ({
  title,
  description,
  buttonLink,
  buttonExist = true,
  buttonLabel
}: {
  title: string,
  description: string,
  buttonLink?: string,
  buttonExist?: boolean,
  buttonLabel?: string
}) => {
  const locale = useLocale()

  return (
    <div className='flex items-end justify-between gap-4 mb-6'>
      <div className='relative ps-4 text-start'>
        <div className='absolute top-1 bottom-1 start-0 w-1 bg-secondary rounded-full' />
        <h2 className='text-2xl sm:text-3xl font-bold text-primary mb-2'>{title}</h2>
        {description && (
          <p className='text-sm sm:text-base text-muted-foreground/80 max-w-2xl leading-relaxed'>
            {description}
          </p>
        )}
      </div>

      {buttonExist && buttonLink && (
        <Button
          asChild
          variant="ghost"
          className="group hidden sm:flex items-center gap-2 hover:bg-transparent hover:text-primary transition-all duration-300"
        >
          <Link href={buttonLink}>
            <span className="text-sm font-semibold">{buttonLabel || (locale === 'en' ? 'View All' : 'عرض الكل')}</span>
            <span className={`p-1 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300`}>
              {locale === 'en' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </span>
          </Link>
        </Button>
      )}
    </div>
  )
}

export default CustomProductsCarousel

