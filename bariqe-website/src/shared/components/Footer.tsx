import { contactWithUs, navigationLinks } from '@/lib/data'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import React from 'react'
import SocialCards from './SocialCards'
import { useLocale, useTranslations } from 'next-intl';
import FadUpReval from '@/shared/animations/FadUpReval';

const Footer = () => {
  const t = useTranslations('')
  const locale = useLocale();

  return (
    <section className='bg-primary py-5 px-4 '>
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-col lg:flex-row items-start py-4 px-5 justify-between gap-8 lg:gap-4'>

          <FadUpReval className='my-4'>

            <Link href={'/'}>
              <Image src={locale === 'en' ? '/white-logo-en.png' : '/white-logo.png'} alt='logo' width={200} height={200} />
            </Link>
            <p className='text-[#CBD5E1] max-w-sm mt-4'>
              {t('siteFooter.description')}
            </p>
            <div className='w-full flex justify-start my-6'>
              <SocialCards />

            </div>

          </FadUpReval>

          <FadUpReval delay={0.05} className='my-4'>
            <h3 className='text-white text-sm lg:text-2xl font-bold mb-4'>{t('siteFooter.importantLinks')}</h3>
            <ul>
              {navigationLinks.map((item, index) =>
                <li key={index} className='mb-1 hover:text-white text-text-secondary'>
                  <Link href={item.href}>{t(item.nameKey)}</Link>
                </li>
              )}
            </ul>

          </FadUpReval>

          <FadUpReval delay={0.05} className='my-4'>
            <h3 className='text-white text-sm lg:text-2xl font-bold mb-4'>{t('siteFooter.contactUs')}</h3>
            <ul>
              {contactWithUs.map((item, index) =>
                <li key={index} className='cursor-pointer hover:text-white mb-1 text-text-secondary '>
                  <a target='_blank' href={`${item.link}`} className='flex items-center gap-2'>
                    {item.icon}
                    <p>{t(`siteFooter.contactInfo.${item.titleKey}`)}</p>
                  </a>
                </li>
              )}
              <li className='mt-3 pt-3 border-t border-text-secondary/30'>
                <div className='flex flex-col gap-1'>
                  <p className='text-xs text-text-secondary/70 uppercase tracking-wide'>{locale === 'en' ? 'National Address' : 'العنوان المختصر'}</p>
                  <div className='flex items-center gap-2'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <p className='text-white font-bold text-lg tracking-wider'>AQGA2589</p>
                  </div>
                </div>
              </li>
            </ul>

          </FadUpReval>

        </div>

        <div className='h-0.5 w-full bg-white/10 mb-8' />
        <div className='w-full text-center flex flex-col items-center justify-center gap-6 text-white pb-4'>
          {/* Primary Copyright */}
          <p className='max-w-xl text-sm sm:text-lg opacity-90'>
            {t('siteFooter.copyright', { year: new Date().getFullYear() })}
          </p>

          {/* Info Badges Container */}
          <div className='flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm'>

            {/* Industrial License Badge */}
            <div className='flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-300 border border-white/10 group cursor-default'>
              <svg className="w-4 h-4 text-[#CBD5E1] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className='flex items-center gap-1.5'>
                <span className='opacity-80'>{t('siteFooter.industrialLicense')}</span>
                <span className='opacity-30'>•</span>
                <span className='font-bold text-white'>{t('siteFooter.industrialLicenseNumber')}</span>
              </div>
            </div>

          </div>

          {/* Developer Credits */}
          <p className={`text-sm flex items-center gap-1 ${locale === 'ar' ? 'flex-row-reverse' : ''} text-white/70`}>
            {locale === 'en' ? 'Developed by' : 'تم التطوير بواسطة'} 
            <Link 
              href="https://www.rockaidev.com" 
              target="_blank" 
              className="font-bold text-white hover:text-blue-400 transition-colors underline decoration-blue-400/30 underline-offset-4"
            >
              Rockai Dev
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Footer
