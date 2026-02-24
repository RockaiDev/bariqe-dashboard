'use client'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import publicAxiosInstance from '@/lib/publicAxiosInstance'
import CustomProductsCarousel from '@/features/products/components/CustomProductsCarousel'
import { Card } from '@/shared/components/ui/card'
import { Quote, User, Star } from 'lucide-react'
import { CarouselItem } from '@/shared/components/ui/carousel'
import { cn } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'
import FadUpReval from '@/shared/animations/FadUpReval'
import Image from 'next/image'
import LoadingComponent from '@/shared/components/LoadingComponent'

const MOCK_REVIEWS = [
    {
        _id: '1',
        client_name_ar: 'أحمد محمد',
        client_name_en: 'Ahmed Mohamed',
        client_position_ar: 'مدير تنفيذي',
        client_position_en: 'CEO',
        review_ar: 'منتجات ممتازة وخدمة رائعة. أنصح الجميع بالتعامل معهم.',
        review_en: 'Excellent products and great service. I recommend everyone to deal with them.',
        rating: 5
    },
    {
        _id: '2',
        client_name_ar: 'سارة علي',
        client_name_en: 'Sara Ali',
        client_position_ar: 'مديرة تسويق',
        client_position_en: 'Marketing Manager',
        review_ar: 'جودة عالية وسرعة في التوصيل. شكراً لكم.',
        review_en: 'High quality and fast delivery. Thank you.',
        rating: 5
    },
    {
        _id: '3',
        client_name_ar: 'خالد عمر',
        client_name_en: 'Khaled Omar',
        review_ar: 'تعامل راقي ومنتجات نظافة فعالة جداً.',
        review_en: 'Classy dealing and very effective cleaning products.',
        rating: 4
    }
];

const CustomerReviews = () => {
    const t = useTranslations('customerReviews');
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
    const apiReviews = businessInfo?.reviews?.items || [];

    // Fallback to mock if API returns empty
    const reviews = apiReviews.length > 0
        ? apiReviews.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        : MOCK_REVIEWS;

    // Show mock loading state if needed
    if (isLoading && !reviews.length) return <div className="py-10"><LoadingComponent /></div>;

    if (!reviews.length) return null;

    return (
        <CustomProductsCarousel
            autoscrol={true}
            autoScrollSpeed={1}
            buttonExist={false}
            title={t('title')}
            description={t('description')}
            align="center"
            showArrows={false}
        >
            {reviews.map((re: any, index: number) => (
                <CarouselItem className="basis-[90%] sm:basis-1/2 md:basis-1/3 lg:basis-1/3 p-4 pl-4" key={re._id || index}>
                    <FadUpReval delay={index * 0.05}>
                        <ReviewCard review={re} local={local} />
                    </FadUpReval>
                </CarouselItem>
            ))}
        </CustomProductsCarousel>
    )
}

export default CustomerReviews

const ReviewCard = ({ review, local }: { review: any, local: string }) => {
    return (
        <Card className={cn(
            "group relative h-full min-h-[280px] flex flex-col items-center justify-center p-8 text-center",
            "bg-white rounded-3xl border border-slate-100",
            "shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
            "transition-all duration-500 hover:-translate-y-1"
        )}>
            {/* Decorative Quote Icon */}
            <Quote className="absolute top-6 left-6 w-10 h-10 text-primary/5 fill-primary/5 rotate-180" />
            <Quote className="absolute bottom-6 right-6 w-10 h-10 text-primary/5 fill-primary/5" />

            {/* Avatar */}
            <div className="relative w-24 h-24 mb-5 rounded-full p-1 bg-gradient-to-br from-primary/20 to-transparent">
                <div className="w-full h-full rounded-full overflow-hidden bg-white border-4 border-white shadow-sm relative">
                    {review.client_image ? (
                        <Image
                            src={review.client_image}
                            alt={local === 'en' ? review.client_name_en : review.client_name_ar}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                            <User className="w-8 h-8 text-primary/30" />
                        </div>
                    )}
                </div>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            "w-5 h-5 transition-colors duration-300",
                            i < (review.rating || 5) ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-100"
                        )}
                    />
                ))}
            </div>

            {/* Review Text */}
            <p className="text-slate-600 mb-6 leading-relaxed line-clamp-4 relative z-10 font-medium">
                &quot;{local === 'en' ? review.review_en : review.review_ar}&quot;
            </p>

            {/* Client Info */}
            <div className="mt-auto">
                <h4 className="text-primary font-bold text-xl mb-1">
                    {local === 'en' ? review.client_name_en : review.client_name_ar}
                </h4>

                {(review.client_position_en || review.client_company_en) && (
                    <p className="text-sm text-slate-400 font-medium">
                        {local === 'en' ? review.client_position_en : review.client_position_ar}
                        {review.client_company_en && (
                            <span className="mx-2 text-slate-300">•</span>
                        )}
                        {review.client_company_en && (
                            <span className="text-secondary">
                                {local === 'en' ? review.client_company_en : review.client_company_ar}
                            </span>
                        )}
                    </p>
                )}
            </div>
        </Card>
    )
}
