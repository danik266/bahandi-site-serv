import type { WriteOffRequest } from '../types'

function toSameOriginUploadUrl(photoUrl: string) {
  if (typeof window === 'undefined' || window.location.protocol !== 'https:') {
    return photoUrl
  }

  try {
    const parsedUrl = new URL(photoUrl)
    if (parsedUrl.protocol !== 'http:' || !parsedUrl.pathname.startsWith('/uploads/')) {
      return photoUrl
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
  } catch {
    return photoUrl
  }
}

export function getPhotoUrl(photoUrl: string) {
  return toSameOriginUploadUrl(photoUrl)
}

export function getRequestPhotoUrls(request: Pick<WriteOffRequest, 'photoUrl' | 'photoUrls'>) {
  const photos = request.photoUrls?.length ? request.photoUrls : [request.photoUrl]
  return photos.filter(Boolean).map(getPhotoUrl)
}
