import React from 'react'
import CustomProductsCarousel from '@/features/products/components/CustomProductsCarousel'
import { Product } from '@/shared/types'
import { useTranslations } from 'next-intl'
import FadUpReval from '@/shared/animations/FadUpReval'

const NEW_ARRIVALS_SECTION_HEADER = {
    title:"",
    description:""
}

const products:Product [] =[
    {
        id:'1',
        image:"/prod.png",
        title:"كارتون مطهر",
        price:19.9,
        offerPrice:16.5,
        rate:4.0,
        rateCount:100,
        productAmount:100
    },
    {
        id:'2',
        image:"/prod.png",
        title:"كارتون مطهر",
        price:19.9,
        offerPrice:0,
        rate:4.0,
        rateCount:100,
        productAmount:100
    },
    {
        id:'3',
        image:"/prod.png",
        title:"كارتون مطهر",
        price:19.9,
        offerPrice:16.5,
        rate:4.0,
        rateCount:100,
        productAmount:100
    },
    {
        id:'3',
        image:"/prod.png",
        title:"كارتون مطهر",
        price:19.9,
        offerPrice:16.5,
        rate:4.0,
        rateCount:100,
        productAmount:100
    },
    {
        id:'4',
        image:"/prod.png",
        title:"كارتون مطهر",
        price:19.9,
        offerPrice:0,
        rate:4.0,
        rateCount:100,
        productAmount:100
    },
    {
        id:'5',
        image:"/prod.png",
        title:"كارتون مطهر",
        price:19.9,
        offerPrice:0,
        rate:4.0,
        rateCount:100,
        productAmount:100
    },
]

const NewArrivals = () => {
  const t = useTranslations('newArrivalsSection');
  return (
    <FadUpReval delay={0.1}>
      <CustomProductsCarousel 
        buttonExist={true}
        buttonLink={'/all-products?newarrival'}
        buttonLabel={t('btn')}
        title={t('title')} description={t('description')} products={products}/>
    </FadUpReval>
  )
}

export default NewArrivals
