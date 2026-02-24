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

        <div className='h-0.5 w-full bg-text-secondary mb-8' />
        <div className='w-full text-center flex flex-col md:flex-col items-center justify-center gap-2 text-white pb-4'>
          <p className='max-w-xl text-sm sm:text-lg'>
            {t('siteFooter.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className='text-xs sm:text-sm text-text-secondary'>
            {locale === 'en' ? 'National Address:' : 'العنوان المختصر:'} <span className='font-bold text-white'>AQGA2589</span>
          </p>
          <p className={`text-sm  flex items-center gap-1 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            Developed by <Link href="https://www.rockaidev.com" target="_blank" className="font-bold hover:text-white/80 transition-colors underline decoration-dotted underline-offset-4">Rockai Dev</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Footer
