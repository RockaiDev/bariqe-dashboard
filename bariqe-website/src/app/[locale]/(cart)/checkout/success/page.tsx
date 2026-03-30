"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { CheckCircle, XCircle, Loader2, Package, ArrowRight} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import FadeUpReval from "@/shared/animations/FadUpReval";
import { useProfile } from "@/shared/hooks/useProfile";

type PaymentStatus = "loading" | "success" | "failed" | "pending";

interface OrderInfo {
  orderId: string;
  orderNumber: string;
}

export default function CheckoutSuccessPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isCodOrder, setIsCodOrder] = useState(false);
  const hasRun = useRef(false);
  const {data:userData} = useProfile();
 
  useEffect(() => {
    // Guard against React Strict Mode double-firing (which clears sessionStorage on first run)
    if (hasRun.current) return;
    hasRun.current = true;

    const verifyPayment = async () => {
      try {
        // Get order info from sessionStorage (saved before redirect)
        const pendingOrderStr = sessionStorage.getItem("pendingOrder");
        
        // Also check URL params (PayLink may send these)
        const transactionNo = searchParams.get("transactionNo");
        const orderStatus = searchParams.get("orderStatus");
        const orderId = searchParams.get("orderId");

        let orderData: OrderInfo | null = null;

        if (pendingOrderStr) {
          const parsed = JSON.parse(pendingOrderStr);
          orderData = { orderId: parsed.orderId, orderNumber: parsed.orderNumber || "" };
          sessionStorage.removeItem("pendingOrder");

          // COD orders: show success immediately without payment verification
          if (parsed.isCod) {
            setOrderInfo(orderData);
            setIsCodOrder(true);
            setStatus("success");
            return;
          }
        } else if (orderId) {
          orderData = { orderId, orderNumber: "" };
        }

        if (!orderData?.orderId) {
          setStatus("failed");
          setErrorMessage(t("errors.noOrderFound"));
          return;
        }

        setOrderInfo(orderData);

        // Check if PayLink returned a status directly
        if (orderStatus === "Paid" || orderStatus === "paid") {
          setStatus("success");
          return;
        }

        if (orderStatus === "Failed" || orderStatus === "failed" || orderStatus === "Canceled") {
          setStatus("failed");
          setErrorMessage(t("errors.paymentFailed"));
          return;
        }

        // If no explicit status from PayLink URL params, payment is still processing
        // (The PayLink webhook will update the order status on the backend)
        setStatus("pending");
      } catch (error: any) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setErrorMessage(error.message || t("errors.verificationFailed"));
      }
    };

    verifyPayment();
  }, [searchParams, t]);

  const handleContinueShopping = () => {
    router.push("/", { locale });
  };

  const handleViewOrders = () => {
    router.push("/profile", { locale });
  };

  return (
    <section className="max-w-2xl mx-auto py-12 px-4 min-h-[60vh] flex items-center justify-center">
      <FadeUpReval className="w-full">
        <Card className="overflow-hidden">
          <CardHeader className="text-center pb-2">
            {status === "loading" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <CardTitle className="text-xl">{t("paymentStatus.verifying")}</CardTitle>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-green-700">
                  {isCodOrder ? t("paymentStatus.codSuccess") : t("paymentStatus.success")}
                </CardTitle>
              </>
            )}

            {status === "pending" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle className="text-xl text-yellow-700">
                  {t("paymentStatus.pending")}
                </CardTitle>
              </>
            )}

            {status === "failed" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-xl text-red-700">
                  {t("paymentStatus.failed")}
                </CardTitle>
              </>
            )}
          </CardHeader>

          <CardContent className="text-center space-y-4 pt-4">
            {status === "loading" && (
              <p className="text-gray-600">{t("paymentStatus.pleaseWait")}</p>
            )}

            {status === "success" && (
              <>
                <p className="text-gray-600">
                  {isCodOrder ? t("paymentStatus.codSuccessMessage") : t("paymentStatus.successMessage")}
                </p>
                {orderInfo?.orderNumber && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-500">{t("paymentStatus.orderNumber")}</p>
                    <p className="text-lg font-semibold text-primary">
                      #{orderInfo.orderNumber}
                    </p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  {userData && <Button onClick={handleViewOrders} variant="default">
                    {t("paymentStatus.viewOrders")}
                  </Button>}
                  <Button onClick={handleContinueShopping} variant="outline">
                    {t("paymentStatus.continueShopping")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {status === "pending" && (
              <>
                <p className="text-gray-600">{t("paymentStatus.pendingMessage")}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Button onClick={handleViewOrders} variant="default">
                    {t("paymentStatus.viewOrders")}
                  </Button>
                  <Button onClick={handleContinueShopping} variant="outline">
                    {t("paymentStatus.continueShopping")}
                  </Button>
                </div>
              </>
            )}

            {status === "failed" && (
              <>
                <p className="text-gray-600">
                  {errorMessage || t("paymentStatus.failedMessage")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Button
                    onClick={() => router.push("/checkout", { locale })}
                    variant="default"
                  >
                    {t("paymentStatus.tryAgain")}
                  </Button>
                  <Button onClick={handleContinueShopping} variant="outline">
                    {t("paymentStatus.continueShopping")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </FadeUpReval>
    </section>
  );
}
