import { renderShareImage } from '@/lib/share-image'

export const alt = 'Flomad Travel - AI-Powered Travel Planning'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return renderShareImage()
}
