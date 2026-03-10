"use client";

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { CircleX } from 'lucide-react';
import { useCart } from '@/shared/hooks/useCart';
import { useState } from 'react';
interface CheckoutCardProps {
    id: string;
    image: string;
    name: string;
    price: number;
    quantity: number;
    discount: number;
}

export const CheckoutCard = ({ id, name, price, quantity, discount, image }: CheckoutCardProps) => {
    const t = useTranslations('checkout');
    const { removeItem } = useCart();
    const [imageError, setImageError] = useState(false);
    const itemSubtotal = quantity * price;
    const discountAmount = (itemSubtotal * discount) / 100;
    const itemTotal = itemSubtotal - discountAmount;
    return (
        <div className='px-6 flex justify-between  gap-4 border-b py-2'>
           

            <Image
                                              src={!image || imageError ? '/product-placeholder.png' : image}
                                              alt={name}
                                              width={50}
                                              height={50}
                                              className="rounded-xl sm:rounded-2xl "
                                              onError={() => setImageError(true)}
                                          />
            <div className='flex-1 max-w-[200px]'>
                <p className='text-text-secondary-2 body-meduim font-medium'>{name}</p>
                <p className='text-text-secondary text-sm'>Qty: {quantity}</p>
                {discount > 0 && (
                    <p className='text-xs text-green-600 font-semibold'>{discount}% OFF</p>
                )}
            </div>

            <div className='flex flex-col items-end gap-1'>
                {discount > 0 && (
                    <p className='text-xs text-gray-400 line-through'>
                        {itemSubtotal.toFixed(2)} <span style={{ fontSize: '12px' }} className="icon-saudi_riyal_new"></span>
                    </p>
                )}
                <p>
                    <span className='text-icon-tertiary font-semibold'>{itemTotal.toFixed(2)}</span>
                    <span className='text-sm'> <span style={{ fontSize: '18px' }} className="icon-saudi_riyal_new"></span></span>
                </p>
            </div>

            <button aria-label={'remove-item'} onClick={() => removeItem(id)}>
                <CircleX className='text-destructive cursor-pointer' />
            </button>


        </div>
    )
}
