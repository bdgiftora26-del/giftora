'use client'

import Link from 'next/link'
import { useT } from '@/components/providers'

export function PromoMosaic() {
  const t = useT()
  return (
    <section className="promo-mosaic" aria-label="Promotions">
      {/* Row 1 */}
      <div className="promo-tile promo-tile-blue">
        <div className="promo-cursive">{t('Home.FreeWithEveryDelivery')}</div>
        <ul className="promo-list">
          <li>{t('Home.FiveRedRoses')}</li>
          <li>{t('Home.GiftWrapping')}</li>
          <li>{t('Home.CardCandle')}</li>
          <li>{t('Home.PhotoConfirmation2')}</li>
        </ul>
        <img src="/placeholders/mosaic/roses.svg" alt="" className="promo-rose-img" width={70} height={70} />
      </div>

      <div className="promo-tile promo-tile-wide promo-tile-center" style={{ background: '#fff' }}>
        <div className="promo-circles" aria-label="Service highlights">
          <div className="promo-circle promo-circle-blue">
            <span className="promo-circle-big">{t('Home.SevenDays')}</span>
            <span>{t('Home.SevenAmToNinePm')}</span>
            <span>{t('Home.DeliveryAllCities')}</span>
          </div>
          <div className="promo-circle promo-circle-red">
            <span className="promo-circle-big">{t('Home.Free')}</span>
            <span>{t('Home.GiftDeliveryDhaka')}</span>
          </div>
          <div className="promo-circle promo-circle-teal">
            <span className="promo-circle-big">{t('Home.FiveOff')}</span>
            <span>{t('Home.AllPackages')}</span>
            <span>{t('Home.DiscountCodeGift')}</span>
          </div>
          <div className="promo-circle promo-circle-lime">
            <span>{t('Home.UrgentSameDay')}</span>
          </div>
        </div>
      </div>

      <div className="promo-tile promo-tile-teal" style={{ position: 'relative' }}>
        <div className="promo-cursive" style={{ color: 'var(--c-teal)' }}>{t('Home.FreshFlowerDelivery')}</div>
        <div className="promo-bn">{t('Home.SummerDiscount')}</div>
        <Link href="/saleitems" className="promo-btn">{t('Home.ViewOptions')}</Link>
        <div className="promo-ribbon">{t('Home.Special')}</div>
      </div>

      {/* Row 2 */}
      <div className="promo-tile promo-tile-pink" style={{ backgroundImage: 'url(/placeholders/mosaic/hearts.svg)', backgroundSize: 'cover' }}>
        <div className="promo-cursive" style={{ color: 'var(--c-red)' }}>{t('Home.SaleItems')}</div>
        <div className="promo-bn">{t('Home.SaleItemsSub')}</div>
        <Link href="/saleitems" className="promo-btn promo-btn-orange">{t('Home.OrderNow')}</Link>
      </div>

      <div className="promo-tile promo-tile-wide" style={{ background: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div className="promo-tile promo-tile-teal" style={{ border: '1px solid var(--c-line)' }}>
          <div className="promo-bn promo-teal-text">{t('Home.PersonalizedGifts')}</div>
          <Link href="/personalised-gifts" className="promo-btn">{t('Home.CustomizeGift')}</Link>
        </div>
        <div className="promo-tile promo-tile-teal" style={{ border: '1px solid var(--c-line)' }}>
          <div className="promo-bn promo-teal-text">{t('Home.FreeGiftChittagong')}</div>
          <Link href="/chittagong-city-free-gift-delivery" className="promo-btn">{t('Home.ViewGiftsChittagong')}</Link>
        </div>
      </div>

      <div className="promo-tile promo-tile-pink" style={{ position: 'relative' }}>
        <div className="promo-bn" style={{ color: 'var(--c-text)', lineHeight: 1.6 }}>{t('Home.BengaliTagline')}</div>
        <img src="/placeholders/mosaic/teddy.svg" alt="" width={80} height={80} style={{ margin: '6px auto 0' }} />
        <Link href="/about-us" className="promo-btn promo-btn-red">{t('Home.AboutUs')}</Link>
      </div>
    </section>
  )
}
