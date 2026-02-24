import { useTranslations } from 'next-intl';
import * as z from "zod";

export const useCheckoutSchema = () => {
  const t = useTranslations('checkout');

  return z.object({
    name: z.string().min(3, { message: t('validation.nameRequired') }),

    countryCode: z.string().min(1, { message: t('validation.phoneRequired') }),

    phoneNumber: z
      .string()
      .min(9, { message: t('validation.phoneInvalid') })
      .max(15, { message: t('validation.phoneInvalid') })
      .regex(/^[0-9]+$/, { message: t('validation.phoneInvalid') }),

    email: z
      .string()
      .email({ message: t('validation.emailInvalid') })
      .optional()
      .or(z.literal('')),

      region: z.string().min(2, { message: t('validation.regionRequired') }),
    city: z.string().min(2, { message: t('validation.cityRequired') }),

    neighborhood: z.string().optional().or(z.literal('')),

    street: z.string().min(2, { message: t('validation.streetRequired') }),

    floor: z.string().optional(),

    blockNumber: z.string().optional(),
    nationalAddress: z.string().optional(),
  });
};

export type CheckoutFormValues = z.infer<ReturnType<typeof useCheckoutSchema>>;
