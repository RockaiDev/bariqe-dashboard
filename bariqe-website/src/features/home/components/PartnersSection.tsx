"use client"
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import publicAxiosInstance from '@/lib/publicAxiosInstance'
import CustomCarousel from '@/features/home/components/shared/CustomCarusol'
import { CarouselItem } from '@/shared/components/ui/carousel'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import Link from 'next/link'

const PartnerLogo = ({ partner, local }: { partner: any, local: string }) => {
    return (
        <div className="relative w-full h-20 sm:h-24 group flex items-center justify-center p-4">
            {partner.image ? (
                <div className="relative w-full h-full">
                    <Image
                        src={partner.image}
                        alt={local === 'en' ? partner.name_en : partner.name_ar}
                        fill
                        priority
                        className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-60 group-hover:opacity-100"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    />
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium bg-muted/10 rounded-lg p-2 text-center text-xs sm:text-sm border border-transparent group-hover:border-primary/20 transition-all">
                    {local === 'en' ? partner.name_en : partner.name_ar}
                </div>
            )}
        </div>
    )
}

const PartnersSection = () => {
    const local = useLocale();

    const { data: responseData, isLoading } = useQuery({
        queryKey: ['business-info'],
        queryFn: async () => {
            try {
                const res = await publicAxiosInstance.get('/public/business-info');
                return res;
            } catch (error) {
                console.error("Failed to fetch business info:", error);
                return null;
            }
        }
    });

    const data = responseData as any;
    const businessInfo = data?.result ? data.result : data;
    const partners = businessInfo?.partners || [];

    if (isLoading) return null; // Or a loading skeleton if preferred
    if (!partners.length) return null;

    const title = local === 'en' ? 'Our Success Partners' : 'شركاء النجاح';
    const description = local === 'en' ? 'Proudly collaborating with industry leaders' : 'نفخر بشراكتنا مع رواد الصناعة';

    // Sort partners by display_order
    const sortedPartners = [...partners].sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

    return (
        <section className='w-full max-w-[1440px] mx-auto py-8 sm:py-12 md:py-16 overflow-hidden px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between mb-8'>
                <div className='relative ps-4 text-start'>
                    <div className='absolute top-1 bottom-1 start-0 w-1 bg-secondary rounded-full' />
                    <h2 className='text-2xl sm:text-3xl font-bold text-primary mb-2'>{title}</h2>
                    <p className='text-sm sm:text-base text-muted-foreground/80 max-w-2xl leading-relaxed'>
                        {description}
                    </p>
                </div>
            </div>

            <div className="w-full relative px-4" dir={local === 'ar' ? 'rtl' : 'ltr'}>
                <CustomCarousel
                    autoscrol={true}
                    autoScrollSpeed={1.5}
                    loop={true}
                    align="center"
                    ClassName="hidden" // Hide navigation arrows for partners
                >
                    {sortedPartners.map((partner: any) => (
                        <CarouselItem
                            key={partner._id}
                            className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 ps-4"
                        >
                            {partner.website ? (
                                <Link href={partner.website} target="_blank" className="block w-full h-full">
                                    <PartnerLogo partner={partner} local={local} />
                                </Link>
                            ) : (
                                <div className="block w-full h-full cursor-default">
                                    <PartnerLogo partner={partner} local={local} />
                                </div>
                            )}
                        </CarouselItem>
                    ))}
                </CustomCarousel>
            </div>
        </section>
    )
}

export default PartnersSection

