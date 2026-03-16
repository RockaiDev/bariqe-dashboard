import { useTranslations } from 'next-intl';
import * as z from "zod";

// Phone validation rules per country code
const phoneRules: Record<string, { length: number; startsWith?: string }> = {
  '+966': { length: 9, startsWith: '5' },   // Saudi Arabia
  '+971': { length: 9, startsWith: '5' },   // UAE
  '+965': { length: 8 },                     // Kuwait
  '+973': { length: 8 },                     // Bahrain
  '+974': { length: 8 },                     // Qatar
  '+968': { length: 8 },                     // Oman
  '+20':  { length: 10, startsWith: '1' },   // Egypt
  '+962': { length: 9 },                     // Jordan
};

export const useCheckoutSchema = () => {
  const t = useTranslations('checkout');

  return z.object({
    name: z.string().min(3, { message: t('validation.nameRequired') }),

    countryCode: z.string().min(1, { message: t('validation.phoneRequired') }),

    phoneNumber: z
      .string()
      .min(1, { message: t('validation.phoneRequired') })
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
    paymentMethod: z.enum(["paylink", "cod"]).default("cod"),
  }).refine((data) => {
    const rule = phoneRules[data.countryCode];
    // Normalize: strip country code prefix and leading zero
    const code = data.countryCode.replace('+', '');
    let phone = data.phoneNumber;
    if (code && phone.startsWith(code)) phone = phone.slice(code.length);
    if (phone.startsWith('0')) phone = phone.slice(1);

    if (!rule) return phone.length >= 8;
    if (phone.length !== rule.length) return false;
    if (rule.startsWith && !phone.startsWith(rule.startsWith)) return false;
    return true;
  }, {
    message: t('validation.phoneFormatInvalid'),
    path: ['phoneNumber'],
  });
};

export type CheckoutFormValues = z.infer<ReturnType<typeof useCheckoutSchema>>;
