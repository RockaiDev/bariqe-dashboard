import { Link } from "@/i18n/routing";
import { Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { CONTACTMAIL, CONTACTPHONE } from "@/lib/data";


export default function TopHeader() {
  const t = useTranslations('topHeader');
  return (
    <div className="hidden md:block w-full bg-primary text-text-primary">
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="w-full  flex flex-col-reverse sm:flex-wrap-reverse sm:flex-row-reverse lg:flex-row gap-2 justify-between items-center py-2">
          {/* Left: CTA */}
          <div className="flex  justify-center items-center">
            <Link href="/all-products" className="body-medium font-semibold underline underline-offset-2 hover:text-white">
              {t('btn')}
            </Link>
          </div>

          {/* Center: Message */}
          {/* <div className="hidden lg:flex  justify-center">
            <span className="text-xs sm:text-sm lg:text-lg font-semibold text-white/95">{t('message')}</span>
          </div> */}

          {/* Right: Contact */}
          <div className=" flex items-center justify-end gap-6">
            <Link href={`tel:${CONTACTPHONE}`} className="body-large flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="h-4 w-4" />
              <span dir="ltr">{CONTACTPHONE}</span>
            </Link>
            <Link href={`mailto:${CONTACTMAIL}`} className="body-large flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="h-4 w-4" />
              <span>{CONTACTMAIL}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

