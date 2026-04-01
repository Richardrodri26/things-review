import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "./providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://things-review.vercel.app'

  return {
    title: {
      default: t('rootTitle'),
      template: '%s — Things Review',
    },
    description: t('rootDescription'),
    metadataBase: new URL(appUrl),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      title: t('rootTitle'),
      description: t('rootDescription'),
      url: appUrl,
      images: [
        {
          url: '/opengraph-image.png',
          width: 1200,
          height: 630,
          alt: t('siteName'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('rootTitle'),
      description: t('rootDescription'),
      images: ['/opengraph-image.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, playfair.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <DirectionProvider direction="ltr">
            <Providers>
              <TooltipProvider>{children}</TooltipProvider>
            </Providers>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
