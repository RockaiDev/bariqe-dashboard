"use client";

import { useCart } from '@/shared/hooks/useCart';
import { EmptyCart } from './EmptyCart';
import { Card } from '@/shared/components/ui/card';
import { CartItems } from './CartItems';
import { CartDetails } from './CartDetails';

export const CartClientPage = () => {
  const { items, total, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <>
      <div className="grid grid-cols-1  lg:grid-cols-3 gap-4 lg:gap-8 mt-4">
        <Card className='lg:col-span-2 bg-white'>
          <CartItems
            items={items}
            onInc={(id, qty) => updateQuantity(id, qty + 1)}
            onDec={(id, qty) => updateQuantity(id, Math.max(1, qty - 1))}
            onRemove={(id) => removeItem(id)}
          />
        </Card>

        <CartDetails items={items} total={total} />

      </div>
    </>
  );
}
