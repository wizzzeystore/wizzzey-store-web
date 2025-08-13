import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { AppSettingsProvider } from '@/context/AppSettingsContext';
import MaintenanceWrapper from '@/components/MaintenanceWrapper';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Script from 'next/script';
import GoogleAnalytics from '../components/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'Wizzzey Store - Your Fashion Destination',
  description: 'Discover the latest trends in clothing at Wizzzey Store.',
  icons: {
    icon: '/wizzzey_logo.png',
    shortcut: '/wizzzey_logo.png',
    apple: '/wizzzey_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_MEASUREMENT_ID =
    process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : undefined;
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
        {GA_MEASUREMENT_ID ? (
          <>
            <Script id="ga4-src" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
            `}</Script>
          </>
        ) : null}
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <CartProvider>
            <AppSettingsProvider>
              <MaintenanceWrapper>
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                  {children}
                </main>
                <Footer />
              </MaintenanceWrapper>
              <Toaster />
              {GA_MEASUREMENT_ID ? <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} /> : null}
            </AppSettingsProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
