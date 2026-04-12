"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from 'react-hot-toast';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useCart } from '@/shared/hooks/useCart';
import { useCheckoutSchema, CheckoutFormValues } from '@/features/cart/schemas/checkout.schema';
import { publicApiService, CheckoutData } from '@/lib/publicApiService';
import { useProfile } from '@/shared/hooks/useProfile';
import { parseStoredInternationalPhone } from '@/features/cart/lib/phone';

export const useCheckoutForm = () => {
    const t = useTranslations('checkout');
    const { items, clearCart } = useCart();
    const { data: profile } = useProfile();
    const locale = useLocale();
    const router = useRouter();

    const formSchema = useCheckoutSchema();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            countryCode: '+966',
            phoneNumber: '',
            city: '',
            email: '',
            region: '',
            neighborhood: '',
            street: '',
            floor: '',
            blockNumber: '',
            nationalAddress: '',
        },
    });

    // Autofill form if user is logged in
    useEffect(() => {
        if (profile) {
            const defaultAddress = profile.addresses?.find((addr: any) => addr.isDefault) || profile.addresses?.[0];
            const { countryCode, localPhone } = parseStoredInternationalPhone(profile.customerPhone);

            form.reset({
                name: profile.customerName || '',
                email: profile.customerEmail || '',
                phoneNumber: localPhone || '',
                countryCode,
                region: defaultAddress?.region || '',
                city: defaultAddress?.city || '',
                neighborhood: defaultAddress?.neighborhood || '',
                street: defaultAddress?.street || '',
                blockNumber: defaultAddress?.building || '',
                nationalAddress: defaultAddress?.nationalAddress || '',
                floor: '', // Not usually in Address type
            });
        }
    }, [profile, form]);

    async function onSubmit(data: CheckoutFormValues) {
        // console.log("Submitting checkout with data:", data);

        if (items.length === 0) {
            toast.error(t('validation.emptyCart'));
            return;
        }

        setIsSubmitting(true);
        try {
            const fullPhone = `${data.countryCode}${data.phoneNumber}`;

            // Get customer ID from profile (fetched from backend via cookies)
            const customerId = profile?._id;

            // Build checkout data
            const checkoutData: CheckoutData = {
                paymentMethod: "cod",
                customer: customerId,
                customerData: {
                    customerName: data.name,
                    customerEmail: data.email || undefined,
                    customerPhone: fullPhone,
                },
                shippingAddress: {
                    fullName: data.name,
                    phone: fullPhone,
                    email: data.email || undefined,
                    street: data.street,
                    city: data.city,
                    region: data.region,
                    neighborhood: data.neighborhood || undefined,
                    building: data.blockNumber || undefined,
                    nationalAddress: data.nationalAddress || undefined,
                },
                products: items.map((item) => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    itemDiscount: item.discount ?? 0,
                })),
                orderNotes: data.floor ? `Floor: ${data.floor}` : undefined,
                // Callback URL for after payment completion
                callbackUrl: `${window.location.origin}/${locale}/checkout/success`,
            };

            // Call the checkout endpoint
            const response = await publicApiService.checkout(checkoutData);
            console.log("Checkout response:", response);

            // Extract order info (handle both response shapes)
            const order = response?.result?.order ;
            const orderId = order?._id || order?.id;
            const orderNumber = order?.orderNumber || "";

            if (!orderId) {
                throw new Error(response?.message || response?.result?.message || t('errors.checkoutFailed'));
            }

            // Store order info for the success page
            sessionStorage.setItem('pendingOrder', JSON.stringify({
                orderId,
                orderNumber,
                isCod: true,
            }));

            // COD: clear cart and navigate to success page (no full refresh)
            clearCart();
            toast.success(t('success.orderCreated'));
            router.push('/checkout/success');

        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return {
        form,
        isSubmitting,
        onSubmit,
    };
};

