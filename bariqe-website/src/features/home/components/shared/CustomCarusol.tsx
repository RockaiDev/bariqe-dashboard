'use client'
import React, { useEffect, useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { EmblaPluginType } from "embla-carousel"
import autoScroll from "embla-carousel-auto-scroll";
import { useLocale } from "next-intl";

interface CustomCarouselProps {
  children: React.ReactNode
  ClassName?: string
  autoplay?: boolean
  autoplayDelay?: number
  autoscrol?: boolean
  autoScrollSpeed?: number
  align?: "start" | "center" | "end"
  loop?: boolean
  showArrows?: boolean
}

const CustomCarousel = ({
  children,
  ClassName,
  autoplay = false,
  autoplayDelay = 2000,
  autoscrol = false,
  autoScrollSpeed = 0.6,
  align = "center",
  loop = true,
  showArrows = true
}: CustomCarouselProps) => {

  const locale = useLocale();
  const [plugins, setPlugins] = useState<EmblaPluginType[]>([]);

  useEffect(() => {
    if (autoplay) {
      const plugin = Autoplay({
        delay: autoplayDelay,
        stopOnInteraction: true,
      });
      setPlugins([plugin]);
    } else if (autoscrol) {
      const plugin = autoScroll({
        speed: autoScrollSpeed,
        playOnInit: true,
        stopOnInteraction: false,
      });
      setPlugins([plugin]);
    }
  }, [autoplay, autoplayDelay, autoscrol, autoScrollSpeed]);

  return (
    <Carousel
      opts={{
        align: align,
        loop: loop,
        direction: locale === 'ar' ? 'rtl' : 'ltr',
      }}
      plugins={plugins}
      className="w-full overflow-visible"
    >
      <CarouselContent>
        {children}
      </CarouselContent>

      {showArrows && (
        <>
          {/* Prev Button */}
          <CarouselPrevious
            className={`
              left-1 md:-left-12 top-1/2 -translate-y-1/2
              rounded-full shadow-md z-20 
              flex items-center justify-center
              bg-white/80 hover:bg-white text-primary border-primary/20
              backdrop-blur-sm transition-all duration-300
              ${ClassName}
            `}
          />

          {/* Next Button */}
          <CarouselNext
            className={`
              right-1 md:-right-12 top-1/2 -translate-y-1/2
              rounded-full shadow-md z-20
              flex items-center justify-center
              bg-white/80 hover:bg-white text-primary border-primary/20
              backdrop-blur-sm transition-all duration-300
              ${ClassName}
            `}
          />
        </>
      )}
    </Carousel>
  )
}

export default CustomCarousel

