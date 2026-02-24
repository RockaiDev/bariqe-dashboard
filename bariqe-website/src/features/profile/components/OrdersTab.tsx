
"use client";

import React, { useState } from "react";
import { useOrders, useCancelOrder } from "@/shared/hooks/useProfile";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, Package, Calendar, DollarSign, XCircle, MapPin, CreditCard, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import CancelOrderDialog from "./CancelOrderDialog";
import { cn } from "@/lib/utils";

const OrdersTab = () => {
    const t = useTranslations("profile.orders");
    const locale = useLocale();
    const { data: orders, isLoading } = useOrders();
    const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'paid': return 'bg-emerald-100 text-emerald-800';
            case 'failed': return 'bg-rose-100 text-rose-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const handleCancelClick = (id: string) => {
        setSelectedOrderId(id);
    }

    const handleConfirmCancel = () => {
        if (selectedOrderId) {
            cancelOrder(selectedOrderId, {
                onSuccess: () => setSelectedOrderId(null)
            });
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">{t("title")}</h2>

            {!orders || !Array.isArray(orders) || orders.length === 0 ? (
                <div className="text-center py-12  rounded-lg border shadow-sm">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">{t("noOrders")}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order._id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50/50 pb-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            {t("orderNumber")} {order.orderNumber}
                                        </CardTitle>
                                        <div className="flex items-center text-xs text-gray-500 mt-1 gap-4">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(order.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="h-3 w-3" />
                                                {order.totalAmount}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge variant="secondary" className={cn("capitalize", getStatusColor(order.status))}>
                                            {t(`statuses.${order.status || 'pending'}` as any)}
                                        </Badge>
                                        {order.payment?.status && order.payment.status !== order.status && (
                                            <span className="text-[10px] text-gray-400 italic">
                                                Payment: {order.payment.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {/* Products Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <ShoppingBag className="h-4 w-4" />
                                        {t("items")}
                                    </div>
                                    <div className="bg-gray-50/50 rounded-lg p-3 space-y-2 border border-gray-100">
                                        {(order.items || []).map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm items-start">
                                                <div className="flex-1">
                                                    <span className="font-medium text-gray-700">{item.quantity}x</span>
                                                    <span className="ms-2">{locale === 'ar' ? item.product?.productNameAr : item.product?.productNameEn}</span>
                                                </div>
                                                <span className="font-semibold text-primary">{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Shipping Section */}
                                    {order.shippingAddress && (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                <MapPin className="h-3 w-3" />
                                                {t("shippingTo")}
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 ps-5">
                                                {order.shippingAddress.fullName}<br />
                                                <span className="text-xs text-gray-400">
                                                    {order.shippingAddress.city}, {order.shippingAddress.street}
                                                    {order.shippingAddress.neighborhood ? `, ${order.shippingAddress.neighborhood}` : ""}
                                                </span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Payment Section */}
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <CreditCard className="h-3 w-3" />
                                            {t("paymentMethod")}
                                        </div>
                                        <div className="ps-5">
                                            <p className="text-sm text-gray-600 capitalize">
                                                {order.payment?.method || 'N/A'}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                Status: <span className="text-primary font-medium">{order.payment?.status || 'Pending'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-gray-50/30 py-3 flex justify-end gap-2">
                                {/* <Button variant="outline" size="sm">{t("viewDetails")}</Button> */}

                                {['pending'].includes(order.status) && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => handleCancelClick(order._id)}
                                    >
                                        <XCircle className="w-3 h-3 mr-1" />
                                        {t("cancel")}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
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

