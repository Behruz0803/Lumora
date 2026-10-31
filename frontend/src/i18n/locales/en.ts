/**
 * English is the source language: an unknown key renders as itself.
 * Only plural variants need explicit entries, because `plural()` looks them up.
 */
export const en: Record<string, string> = {
  'product.one': 'product',
  'product.few': 'products',
  'product.many': 'products',
  'supplier.one': 'supplier',
  'supplier.few': 'suppliers',
  'supplier.many': 'suppliers',
  'offer.one': 'offer',
  'offer.few': 'offers',
  'offer.many': 'offers',
  'supplier offer.one': 'supplier offer',
  'supplier offer.few': 'supplier offers',
  'supplier offer.many': 'supplier offers',
  'saved offer.one': 'saved offer',
  'saved offer.few': 'saved offers',
  'saved offer.many': 'saved offers',
}
