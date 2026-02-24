"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from 'react-hot-toast';
import { useLocale, useTranslations } from 'next-intl';
import { useCart } from '@/shared/hooks/useCart';
import { useCheckoutSchema, CheckoutFormValues } from '@/features/cart/schemas/checkout.schema';
import { publicApiService, CheckoutData } from '@/lib/publicApiService';
import { useProfile } from '@/shared/hooks/useProfile';

export const useCheckoutForm = () => {
    const t = useTranslations('checkout');
    const { items, total, clearCart } = useCart();
    const { data: profile } = useProfile();
    const locale = useLocale();

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

            form.reset({
                name: profile.customerName || '',
                email: profile.customerEmail || '',
                phoneNumber: profile.customerPhone?.replace('+966', '') || '',
                countryCode: profile.customerPhone?.startsWith('+') ? profile.customerPhone.substring(0, 4) : '+966',
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
        console.log("Submitting checkout with data:", data);

        if (items.length === 0) {
            toast.error(t('validation.emptyCart'));
            return;
        }

        setIsSubmitting(true);
        try {
            const fullPhone = `${data.countryCode}${data.phoneNumber}`;

            // Build checkout data for PayLink integration
            const checkoutData: CheckoutData = {
                paymentMethod: "paylink",
                customer: profile?._id,
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
            if (response.status === 200 && response.result?.paymentUrl) {
                // Store order info in sessionStorage for the success page
                sessionStorage.setItem('pendingOrder', JSON.stringify({
                    orderId: response.result.order._id,
                    orderNumber: response.result.order.orderNumber || "",
                }));

                toast.success(t('success.redirectingToPayment'));

                // Clear the cart before redirecting
                clearCart();
                form.reset();

                // Redirect to PayLink payment page
                window.location.href = response.result.paymentUrl;
            } else {
                throw new Error(response.message || t('errors.checkoutFailed'));
            }

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

