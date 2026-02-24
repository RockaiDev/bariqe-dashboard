"use client";

import { useEffect, useState, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { CheckCircle, XCircle, Loader2, Package, ArrowRight, AlertCircle, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { publicApiService } from "@/lib/publicApiService";
import FadeUpReval from "@/shared/animations/FadUpReval";
import { useCart } from "@/shared/hooks/useCart";

type PaymentStatus = "loading" | "success" | "failed" | "pending";

interface OrderStatusPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function OrderStatusPage(props: OrderStatusPageProps) {
  const { clearCart } = useCart();
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  
  const { id } = params;
  
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();

  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    const checkStatus = async () => {
      try {
        // Retrieve params from Paylink redirect
        const transactionNo = searchParams?.transactionNo as string;
        const orderStatus = searchParams?.orderStatus as string;
        // Sometimes Paylink sends the order ID as orderNumber
        const urlOrderNumber = searchParams?.orderNumber as string;
        
        // Call backend to verify status
        // Using the Paylink webhook endpoint directly as requested
        const response = await publicApiService.verifyPaylinkWebhook(urlOrderNumber || id, transactionNo || "");

        if (response.success) {
           const paymentStatus = response.order?.payment?.status || response.order?.status;
           setOrderNumber(response.order?.orderNumber || urlOrderNumber || "");

           if (paymentStatus === "paid" || paymentStatus === "Paid" || paymentStatus === "completed" || paymentStatus === "confirmed" || response.order?.orderStatus === "confirmed") {
             setStatus("success");
             clearCart();
           } else if (paymentStatus === "failed" || paymentStatus === "Failed" || paymentStatus === "cancelled") {
             setStatus("failed");
             setErrorMessage(t("errors.paymentFailed"));
           } else {
             // If backend says pending...
             // If we have a transactionNo, it's likely just processing payment
             setStatus("pending");
             clearCart();
           }
        } else {
           // Verification API failed or returned success:false
           // If we have a transactionNo, assume it's a sync delay and show Pending instead of Failed
           if (transactionNo) {
             console.log("Verification failed but transactionNo exists, showing pending");
             setStatus("pending");
           } else {
             setStatus("failed");
             setErrorMessage(t("errors.verificationFailed"));
           }
        }

      } catch (error: any) {
        console.error("Status check error:", error);
        // Fallback: if we have transactionNo, don't scare user with Failed
        const transactionNo = searchParams?.transactionNo;
        if (transactionNo) {
           setStatus("pending");
        } else {
           setStatus("failed");
           setErrorMessage(error.message || t("errors.verificationFailed"));
        }
      }
    };

    checkStatus();
  }, [id, searchParams, t]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50/50">
      <FadeUpReval className="w-full max-w-lg">
        <Card className="border-none shadow-xl">
           <CardHeader className="text-center space-y-4 pb-2">
             
             {/* Loading State */}
             {status === "loading" && (
               <div className="flex flex-col items-center gap-4">
                 <div className="relative">
                   <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                     <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                   </div>
                 </div>
                 <div>
                   <CardTitle className="text-xl mb-1">{t("paymentStatus.verifying")}</CardTitle>
                   <CardDescription>{t("paymentStatus.pleaseWait")}</CardDescription>
                 </div>
               </div>
             )}

             {/* Success State */}
             {status === "success" && (
               <div className="flex flex-col items-center gap-4">
                 <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-300">
                   <CheckCircle className="w-10 h-10 text-green-600" />
                 </div>
                 <div>
                   <CardTitle className="text-2xl text-green-700 mb-2">{t("paymentStatus.success")}</CardTitle>
                   <CardDescription className="text-base">{t("paymentStatus.successMessage")}</CardDescription>
                 </div>
               </div>
             )}

            {/* Pending State */}
            {status === "pending" && (
               <div className="flex flex-col items-center gap-4">
                 <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
                   <Package className="w-10 h-10 text-yellow-600" />
                 </div>
                 <div>
                   <CardTitle className="text-xl text-yellow-700 mb-1">{t("paymentStatus.pending")}</CardTitle>
                   <CardDescription>{t("paymentStatus.pendingMessage")}</CardDescription>
                 </div>
               </div>
             )}

             {/* Failed State */}
             {status === "failed" && (
               <div className="flex flex-col items-center gap-4">
                 <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                   <AlertCircle className="w-10 h-10 text-red-600" />
                 </div>
                 <div>
                    <CardTitle className="text-xl text-red-700 mb-1">{t("paymentStatus.failed")}</CardTitle>
                    <CardDescription className="max-w-xs mx-auto">
                      {errorMessage || t("paymentStatus.failedMessage")}
                    </CardDescription>
                 </div>
               </div>
             )}

           </CardHeader>

           <CardContent className="text-center pt-2">
              {status === "success" && orderNumber && (
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 my-4">
                  <p className="text-sm text-green-600 mb-1">{t("paymentStatus.orderNumber")}</p>
                  <p className="text-xl font-bold text-green-800 tracking-wide">#{orderNumber}</p>
                </div>
              )}
           </CardContent>

           <CardFooter className="flex flex-col gap-3 pt-2 pb-8">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  onClick={() => router.push("/profile", { locale })} 
                  className="flex-1 gap-2" 
                  size="lg"
                  variant="default"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {t("paymentStatus.viewOrders")}
                </Button>
                
                <Button 
                  onClick={() => router.push("/", { locale })} 
                  className="flex-1 gap-2" 
                  size="lg"
                  variant="outline"
                >
                  {t("paymentStatus.continueShopping")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              
              {status === "failed" && (
                 <Button 
                   variant="ghost" 
                   className="text-sm text-muted-foreground hover:text-primary mt-2"
                   onClick={() => window.location.reload()}
                 >
                   {t("paymentStatus.tryAgain")}
                 </Button>
              )}
           </CardFooter>
        </Card>
      </FadeUpReval>
    </div>
  );
}
