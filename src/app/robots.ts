import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://things-review.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register'],
        disallow: ['/api/', '/(app)/'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
