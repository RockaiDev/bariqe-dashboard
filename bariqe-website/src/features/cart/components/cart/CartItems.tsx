"use client";

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import Image from 'next/image';
import { Button } from '@/shared/components/ui/button';
import { Minus, Plus, Trash } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface CartItemsProps {
  items: any[];
  onInc: (id: string, qty: number) => void;
  onDec: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export const CartItems = ({ items, onInc, onDec, onRemove }: CartItemsProps) => {
  const t = useTranslations('cart.items');
  const local = useLocale();
  const [imageError, setImageError] = useState(false);
  return (
    <Table>

      <TableHeader className=''>
        <TableRow className='hidden md:table-row text-center'>
          <TableHead className='text-right pr-4 sm:pr-12'>{t('product')}</TableHead>
          <TableHead className='text-center'>{t('price')}</TableHead>
          <TableHead className='text-center'>{t('quantity')}</TableHead>
          <TableHead className='text-center'>{t('remove')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className='text-center'>
        {items.map((item: any) => (
          <TableRow key={item.id}>
            <TableCell className='max-w-[200px] flex items-center gap-4'>
               <Image
                                  src={!item.product?.productImage || imageError ? '/product-placeholder.png' : item.product?.productImage}
                                  alt={local === 'en' ? item.product?.productNameEn : item.product?.productNameAr}
                                  width={100}
                                  height={100}
                                  className="rounded-xl sm:rounded-2xl hover:scale-105 duration-500 w-full h-full object-cover"
                                  onError={() => setImageError(true)}
                              />
              <div className='flex h-auto items-center justify-center flex-col w-xs'>
                <p className='text-action-hover w-[130px] md:max-w-[200px] whitespace-normal break-words  font-semibold h-auto'>{local === 'en' ? item.product?.productNameEn : item.product?.productNameAr || 'Product'}</p>
                <p className='body-small text-icon-tertiary'>{item.quantity} {t('productUnit')}</p>
              </div>
            </TableCell>
            <TableCell className='body-medium text-icon-tertiary hidden md:table-cell'>{item.price} <span style={{ fontSize: '28px' }} className=" icon-saudi_riyal_new"></span></TableCell>
            <TableCell className='max-w-[180px]'>

              <div className=' flex md:hidden items-center justify-between my-2 px-4'>
                <p className='text-xs sm:text-sm text-icon-tertiary'>{item.price} <span style={{ fontSize: '28px' }} className=" icon-saudi_riyal_new"></span></p>
                <Button variant={'ghost'} onClick={() => onRemove(item.id)}><Trash className='text-destructive' /></Button>
              </div>
              <Card className={cn('max-w-[180px] p-1 sm:p-2 rounded-full flex flex-row items-center justify-between gap-2')}>
                <Button className={cn('rounded-full bg-text-secondary-2/30 text-icon-on-action hover:text-white')} onClick={() => onInc(item.id, item.quantity)}><Plus className='w-4 h-4 sm:w-6 sm:h-6' /></Button>
                <p className='text-text-secondary-2 font-medium'>{item.quantity}</p>
                <Button className={cn('rounded-full bg-text-secondary-2/30 text-icon-on-action hover:text-white')} onClick={() => onDec(item.id, item.quantity)}><Minus className='w-4 h-4 sm:w-6 sm:h-6' /></Button>

              </Card>
            </TableCell>
            <TableCell className='hidden md:table-cell'><Button variant={'ghost'} onClick={() => onRemove(item.id)}><Trash className='text-destructive' /></Button></TableCell>
          </TableRow>
        ))}

      </TableBody>
    </Table>
  )
}
