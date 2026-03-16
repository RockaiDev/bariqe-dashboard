
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useOrders, useCancelOrder } from "@/shared/hooks/useProfile";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, Package, Calendar, MapPin, CreditCard, ShoppingBag, Truck, Receipt, ChevronDown, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/shared/components/ui/collapsible";
import CancelOrderDialog from "./CancelOrderDialog";
import { cn } from "@/lib/utils";

const OrdersTab = () => {
    const t = useTranslations("profile.orders");
    const locale = useLocale();
    const { data: orders, isLoading } = useOrders();
    
    const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

    const toggleExpand = (orderId: string) => {
        setExpandedOrders(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-indigo-100 text-indigo-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'paid': return 'bg-emerald-100 text-emerald-800';
            case 'failed': return 'bg-rose-100 text-rose-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleConfirmCancel = () => {
        if (selectedOrderId) {
            cancelOrder(selectedOrderId, {
                onSuccess: () => setSelectedOrderId(null)
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return `${amount.toFixed(2)} ${t("sar")}`;
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">{t("title")}</h2>

            {!orders || !Array.isArray(orders) || orders.length === 0 ? (
                <div className="text-center py-12 rounded-lg border shadow-sm">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">{t("noOrders")}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const isExpanded = expandedOrders.has(order._id);
                        return (
                        <Collapsible
                            key={order._id}
                            open={isExpanded}
                            onOpenChange={() => toggleExpand(order._id)}
                        >
                        <Card className="overflow-hidden">
                            {/* Header - always visible */}
                            <CollapsibleTrigger asChild>
                            <CardHeader
                                className="bg-gray-50/50 pb-3 cursor-pointer hover:bg-gray-100/50 transition-colors"
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <CardTitle className="text-base font-semibold">
                                            {t("orderNumber")} {order.orderNumber || order.payment?.invoiceId || order._id?.slice(-8)}
                                        </CardTitle>
                                        <div className="flex flex-wrap items-center text-xs text-gray-500 mt-1 gap-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(order.createdAt)}
                                            </span>
                                            <span className="font-semibold text-primary">
                                                {formatCurrency(order.total)}
                                            </span>
                                            <span className="text-gray-400">
                                                {order.products?.length || 0} {t("item")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className={cn("capitalize", getStatusColor(order.orderStatus))}>
                                            {t(`statuses.${order.orderStatus || 'pending'}` as any)}
                                        </Badge>
                                        <ChevronDown className={cn(
                                            "h-4 w-4 text-gray-400 transition-transform duration-300",
                                            isExpanded && "rotate-180"
                                        )} />
                                    </div>
                                </div>
                            </CardHeader>
                            </CollapsibleTrigger>

                            {/* Animated expandable details */}
                            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                            <CardContent className="pt-4 space-y-5">
                                {/* Products list with images and prices */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <ShoppingBag className="h-4 w-4" />
                                        {t("items")}
                                    </div>
                                    <div className="space-y-3">
                                        {(order.products || []).map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                                                {/* Product image */}
                                                <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                                                    <Image
                                                        src={item.product?.productImage || "/product-placeholder.png"}
                                                        alt={locale === 'ar' ? item.product?.productNameAr : item.product?.productNameEn}
                                                        fill
                                                        className="object-cover"
                                                        sizes="64px"
                                                    />
                                                </div>
                                                {/* Product info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {locale === 'ar' ? item.product?.productNameAr : item.product?.productNameEn}
                                                    </p>
                                                    {item.product?.productCode && (
                                                        <p className="text-[10px] text-gray-400">{item.product.productCode}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                        <span>{t("quantity")}: {item.quantity}</span>
                                                        {item.product?.productNewPrice != null && (
                                                            <span className="font-medium text-primary">
                                                                {formatCurrency(item.product.productNewPrice)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Line total */}
                                                {item.product?.productNewPrice != null && (
                                                    <div className="text-sm font-semibold text-primary flex-shrink-0">
                                                        {formatCurrency(item.product.productNewPrice * item.quantity)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order summary */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Receipt className="h-4 w-4" />
                                        {t("orderSummary")}
                                    </div>
                                    <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100 space-y-1.5 text-sm">
                                        <div className="flex justify-between text-gray-600">
                                            <span>{t("subtotal")}</span>
                                            <span>{formatCurrency(order.subtotal)}</span>
                                        </div>
                                        {order.orderDiscount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>{t("discount")} ({order.orderDiscount}%)</span>
                                                <span>-{formatCurrency(order.subtotal * order.orderDiscount / 100)}</span>
                                            </div>
                                        )}
                                        {order.shippingCost > 0 && (
                                            <div className="flex justify-between text-gray-600">
                                                <span>{t("shippingCost")}</span>
                                                <span>{formatCurrency(order.shippingCost)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-gray-800 border-t pt-1.5 mt-1.5">
                                            <span>{t("totalAmount")}</span>
                                            <span className="text-primary">{formatCurrency(order.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Shipping address */}
                                    {order.shippingAddress && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                <MapPin className="h-4 w-4" />
                                                {t("shippingTo")}
                                            </div>
                                            <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100 text-sm text-gray-600 space-y-0.5">
                                                <p className="font-medium">{order.shippingAddress.fullName}</p>
                                                <p className="text-xs text-gray-500">{order.shippingAddress.phone}</p>
                                                <p className="text-xs text-gray-500">
                                                    {[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.region]
                                                        .filter(Boolean).join(", ")}
                                                </p>
                                                {order.shippingAddress.nationalAddress && (
                                                    <p className="text-xs text-gray-400">{order.shippingAddress.nationalAddress}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment info */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <CreditCard className="h-4 w-4" />
                                            {t("paymentMethod")}
                                        </div>
                                        <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100 text-sm text-gray-600 space-y-0.5">
                                            <p className="font-medium">
                                                {order.payment?.method === 'cod' ? t("cod") : order.payment?.method === 'paylink' ? t("paylink") : (order.payment?.method || 'N/A')}
                                            </p>
                                            <Badge variant="secondary" className={cn("text-[10px] mt-1", getStatusColor(order.payment?.status || 'pending'))}>
                                                {t(`statuses.${order.payment?.status || 'pending'}` as any)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping tracking */}
                                {order.shipping?.trackingNumber && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Truck className="h-4 w-4" />
                                            {t("trackingNumber")}
                                        </div>
                                        <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100 text-sm">
                                            <p className="font-mono text-primary">{order.shipping.trackingNumber}</p>
                                            {order.shipping.status && (
                                                <p className="text-xs text-gray-500 mt-1">{order.shipping.status}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Cancel button for cancellable orders */}
                                {['pending', 'confirmed', 'processing'].includes(order.orderStatus) && (
                                    <div className="pt-2 border-t">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setSelectedOrderId(order._id)}
                                            className="flex items-center gap-2"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            {t("cancel")}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                            </CollapsibleContent>
                        </Card>
                        </Collapsible>
                        );
                    })}
                </div>
            )}

            <CancelOrderDialog
                isOpen={!!selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
                onConfirm={handleConfirmCancel}
                isPending={isCancelling}
            />
        </div>
    );
};

export default OrdersTab;

