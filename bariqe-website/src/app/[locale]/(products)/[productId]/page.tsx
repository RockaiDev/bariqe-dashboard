'use client';
import CustomCarousel from '@/features/home/components/shared/CustomCarusol'
import CustomBreadcrumb from '@/shared/components/CustomBreadcrumb'
import CustomButton from '@/shared/components/CustomButton'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { CarouselItem } from '@/shared/components/ui/carousel'
import { cn } from '@/lib/utils'
import { CreditCard, Dot, Minus, Plus, Share2, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import React, { useMemo, useState } from 'react'
import { Icon } from "@iconify/react";
import CustomProductsCarousel from '@/features/products/components/CustomProductsCarousel'
import { Product } from '@/shared/types'
import { CheckmarkIcon } from 'react-hot-toast';
import CustomerReviews from '@/features/home/components/CustomerReviews';
import { useLocale, useTranslations } from 'next-intl';
import { useCart } from '@/shared/hooks/useCart';
import type { Product as StoreProduct } from '@/lib/publicApiService';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useCrud, useShow } from '@/shared/hooks/useCrud';
import Loading from '@/app/loading';




const ProductDetails = () => {
    const tNav = useTranslations('navigation');
    const tProd = useTranslations('product');
    const tCard = useTranslations('productCard');
    const tCR = useTranslations('customerReviews');
    const [showData, setShowData] = useState(true);
    const [quantity, setQuantity] = useState<number>(1);
    const [imgError, setImgError] = useState(false);
    const { addItem, items, removeItem } = useCart();
    const router = useRouter();



    const params = useParams();
    const { list } = useCrud('public/products')
    const { list: singleProductQuery } = useCrud(`public/products/${params.productId}`);
    const isProductLoading = singleProductQuery.isLoading;
    const rawData = singleProductQuery.data as any;
    const product: Product | undefined = rawData?.result || rawData?.data || rawData as Product | undefined;
    console.log(product)
    const itemInCart = items.find((it: any) => it.id === params.productId);
    const local = useLocale()


    const handleShare = async () => {
        if (navigator.share && product) {
            try {
                await navigator.share({
                    title: local === 'en' ? product.productNameEn : product.productNameAr,
                    text: local === 'en' ? product.productDescriptionEn : product.productDescriptionAr,
                    url: `${window.location.origin}/${local}/${params.productId}`,
                });
            } catch (err) {
                console.log("Share canceled", err);
            }
        } else {
            alert("Sharing not supported on this device.");
        }
    };
    const filteredData = useMemo(() => {
        if (!list.data?.data) return [];
        return list.data?.data.filter((el) => el._id !== params.productId)
    }, [list.data?.data, params.productId])

    // Use fetched product
    const discount = Number(product?.productDiscount || 0);
    const oldPrice = Number(product?.productOldPrice || 0);
    const hasOffer = discount > 0 && discount <= 100;

    const realPrice = hasOffer && product
        ? oldPrice - (oldPrice * (discount / 100))
        : oldPrice;

    if (isProductLoading) return <Loading />
    if (!product) return <div className="h-screen flex items-center justify-center">Product not found</div>;
    return (
        <section
            className='max-w-7xl mx-auto py-8 px-5 sm:px-5'
        >

            <CustomBreadcrumb
                items={
                    [
                        {
                            label: tNav('allProducts'),
                            href: "/all-products"
                        },
                        {
                            label: local === 'en' ? product.productNameEn : product.productNameAr,

                        }
                    ]
                }
            />

            <div className='flex flex-col lg:flex-row items-center lg:items-start justify-between my-4 gap-4'>
                <div className='flex-1 p-4'>


                    <Image
                        onError={() => setImgError(true)}
                        src={imgError || !product.productImage ? '/product-placeholder.png' : product.productImage}
                        alt={(local === 'en' ? product.productDescriptionEn : product.productDescriptionAr) || 'Product Image'}
                        width={500}
                        height={500}
                        className='object-cover rounded-lg'
                    />
                    {/* <CustomCarousel> 
            {imagesUrls.map((url,index)=>
            <CarouselItem key={index}>
            </CarouselItem>
            )}
        </CustomCarousel> */}
                </div>
                <div className='w-full between-flex flex-1 flex-col gap-3 '>

                    <div className='w-full flex items-center justify-between'>
                        <h5 className='underline body-large text-text-secondary-2 font-medium'>{local === 'en' ? product.productCategory?.categoryNameEn : product.productCategory?.categoryNameAr}</h5>
                        <Button onClick={handleShare} variant="outline" size={'icon-lg'} className={cn('rounded-full text-text-secondary-2')}><Share2 /></Button>

                    </div>

                    <div className='w-full mt-4 flex items-start justify-between gap-3'>
                        <div className='border-b pb-2'>
                            <h2 className='text-xl lg:text-3xl font-semibold text-action-hover mb-8'>{local === 'en' ? product.productNameEn : product.productNameAr}</h2>
                            {/* <div className="flex items-center justify-start gap-2">
                                <Image src='/star-fill.png' width={20} height={20} alt='star' className="text-secondary"/>
                                <span className="text-text-secondary-2 body-small">{rate}</span>
                                <span className="text-text-secondary body-small">({rateCount} {tProd('reviews')})</span>
                            </div> */}

                        </div>
                        <p className='text-primary font-bold text-2xl lg:text-3xl flex items-center gap-1'>{Number(realPrice.toFixed(2))} <span className="text-xl icon-saudi_riyal_new"></span></p>
                    </div>

                    <div className='w-full flex items-center justify-start gap-2'>
                        <Badge variant={'outline'} className={cn('rounded-full text-primary font-bold text-sm')}>{tCard('availableUnits', { count: product.amount })} </Badge>

                        {/* <Badge variant={'default'}  className={cn('rounded-full text-white font-medium text-sm')}>2 لتر لكل عبوة </Badge> */}
                        {product.productMoreSale && <Badge variant={'destructive'} className={cn('rounded-full text-white font-medium text-sm')}>{tProd('bestSeller')} </Badge>}
                        {/* {goldWarranty && <Badge variant={'default'}  className={cn('bg-success rounded-full text-white font-medium text-sm')}>ضمان ذهبى </Badge>} */}
                    </div>
                    {/* <ul className='w-full'>
            {description.map((item,index)=>
            <li key={index} className='w-full flex items-center justify-start gap-2 mb-2'>
                <Dot className='text-primary'/>
                <p className='max-w-xl body-small text-text-secondary-2'>{item}</p>
            </li>
            )}

        </ul> */}
                    <div className='w-full between-flex'>
                        <p className='text-primary body-large'>{tProd('addQuantity')}</p>

                        <Card className={cn('w-[260px] p-2 rounded-full flex flex-row items-center justify-between gap-2')}>
                            <Button disabled={product.amount === 0} onClick={() => setQuantity(q => q + 1)} className={cn('rounded-full bg-text-secondary-2/30 text-icon-on-action hover:text-white')}><Plus /></Button>
                            <p className='text-text-secondary-2 font-medium'>{quantity}</p>
                            <Button disabled={product.amount === 0} onClick={() => setQuantity(q => Math.max(1, q - 1))} className={cn('rounded-full bg-text-secondary-2/30 text-icon-on-action hover:text-white')}><Minus /></Button>

                        </Card>
                    </div>

                    <Card className={cn('w-full border-none  shadow-none sm:border-2 border-text-secondary lg:px-18')}>
                        <CustomButton
                            disabled={product.amount === 0}
                            onClick={() => {
                                if (product.amount === 0) {
                                    toast.error(local === 'en' ? 'Out of stock' : 'نفذت الكمية');
                                    return;
                                }
                                const mapped: StoreProduct = {
                                    _id: product._id,
                                    productNameEn: product.productNameEn,
                                    productNameAr: product.productNameAr,
                                    productImage: product.productImage,
                                    productPrice: oldPrice,  // Store original price for backend calculation
                                    productDiscount: discount, // Store the discount percentage
                                    // discountTiers: product.discountTiers || [],
                                } as unknown as StoreProduct;
                                addItem(mapped, quantity);
                                router.push('/cart');
                            }}
                            className={`w-full py-2 px-4 sm:w- ${product.amount === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-secondary text-white'}`}><CreditCard /> <span>{product.amount === 0 ? (local === 'en' ? 'Out of Stock' : 'نفذت الكمية') : tProd('buyNow')}</span> </CustomButton>
                        <CustomButton
                            disabled={product.amount === 0}
                            onClick={() => {
                                if (product.amount === 0) {
                                    toast.error(local === 'en' ? 'Out of stock' : 'نفذت الكمية');
                                    return;
                                }
                                const mapped: StoreProduct = {
                                    _id: product._id,
                                    productNameEn: product.productNameEn,
                                    productNameAr: product.productNameAr,
                                    productImage: product.productImage,
                                    productPrice: oldPrice, // Store original price for backend calculation
                                    productDiscount: discount, // Store the discount percentage
                                    // discountTiers: product.discountTiers || [],
                                } as unknown as StoreProduct;
                                addItem(mapped, quantity);
                                toast.success(tProd('addedToCart') || 'Added to cart');
                            }}
                            className={`w-full py-2 px-4 sm:w- ${product.amount === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-none' : 'border border-primary hover:bg-primary text-primary hover:text-white'}`}><ShoppingCart /> <span>{product.amount === 0 ? (local === 'en' ? 'Out of Stock' : 'نفذت الكمية') : tProd('addToCart')}</span> </CustomButton>


                    </Card>
                </div>

            </div>

            <p className='w-full flex justify-center items-center  body-small text-text-secondary-2'>
                {local === 'en' ? product.productDescriptionEn : product.productDescriptionAr}
            </p>
            {/* featurs & reviews  */}
            {/* <div className='w-full flex justify-center items-center gap-2'>
            <CustomButton 
            className={`py-2 px-8 border border-primary cursor-pointer ${showData ?'bg-primary text-white':''}`}
            onClick={()=>setShowData(true)}
            >{tProd('features')}</CustomButton>

            <CustomButton 
            className={`py-2 px-8 border border-primary cursor-pointer ${showData === false ?'bg-primary text-white':''}`}
            onClick={()=>setShowData(false)}
            > {tCR('title')}</CustomButton>

        </div> */}

            {/* {showData ? (
            <div className='flex flex-col sm:flex-row justify-center gap-2 mt-4 sm:mt-8 items-start'>
                <ul className={`flex-1  ${local === 'en'? 'sm:border-r-2':'sm:border-l-2'}`}>
                    <h5 className='h-6 lg:h-3 text-action-hover mb-8'>{tProd('features')}</h5>

                    {productFeatures.map((feature,index)=>
                    <li key={index} className='w-full flex items-center justify-start gap-2 mb-2'>
                        <CheckmarkIcon className='text-primary'/>
                        <p className='max-w-xl body-meduim lg:body-large  text-text-secondary-2'>{feature}</p>
                    </li>
                    )}

                </ul>
                <ul className='flex-1'>
                    <h5 className='h-6 lg:h-3 text-action-hover  mb-8'>{tProd('details')}</h5>

                    {productDetails.map((detail,index)=>
                    <li key={index} className='w-full flex items-center justify-start gap-2 mb-2'>
                        <CheckmarkIcon className='text-primary'/>
                        <p className='max-w-xl body-meduim  lg:body-large text-text-secondary-2'>{detail}</p>
                    </li>
                    )}
                </ul>
            </div>
        ) : ( 
            <div>
               <CustomerReviews />
            </div>
         )}*/}
            <CustomProductsCarousel
                title={tProd('relatedProducts')}
                description={tProd('relatedProducts')}
                buttonExist={true}
                buttonLink='/all-products'
                products={filteredData} />

        </section>
    )
}

export default ProductDetails

const IconCard = ({ children }: { children: React.ReactNode }) => {
    return (
        <Card
            className='p-4'
        >{children}</Card>
    )
}