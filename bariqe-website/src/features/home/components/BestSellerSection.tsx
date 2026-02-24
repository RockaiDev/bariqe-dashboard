'use client';

import { Product } from "@/shared/types"

import CustomProductsCarousel from "@/features/products/components/CustomProductsCarousel"
import { useTranslations } from "@/shared/hooks/useTranslations"
import FadUpReval from '@/shared/animations/FadUpReval'
import { useCrud } from "@/shared/hooks/useCrud";
import { useMemo } from "react";
import LoadingComponent from "@/shared/components/LoadingComponent";


const BestSellerSection = () => {
  const t = useTranslations("bestsellerSection");

  const { list } = useCrud('public/products')

  const filterdProducts = useMemo(() => {
    if (!list.data) return []

    return list.data.data.filter((el) => el.productMoreSale === true);

  }, [list.data?.data])

  if (list.isLoading) return <LoadingComponent />
  return (
    <FadUpReval delay={0.1}>
      <CustomProductsCarousel
        buttonExist={true}
        buttonLink={'/all-products'}
        buttonLabel={t('btn')}
        title={t('title')}
        description={t('description')}
        products={filterdProducts}
        align="center"
        loop={true}
      />


    </FadUpReval>
  )
}

export default BestSellerSection

