import type React from "react";
import type { Metadata } from "next";
import { JotaiProvider } from "../lib/jotai-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Fernet Barato - Los mejores precios de fernet cerca tuyo",
    template: "%s | Fernet Barato"
  },
  description: "Encuentra los mejores precios de fernet en Argentina. Compara precios en tiempo real, encuentra las tiendas más cercanas y ahorra dinero en tu fernet favorito.",
  keywords: [
    "fernet precios",
    "fernet barato", 
    "precios fernet argentina",
    "comparador precios",
    "fernet branca",
    "tiendas fernet",
    "ofertas fernet",
    "precio fernet hoy"
  ],
  authors: [{ name: "Fernet Barato Team" }],
  creator: "Fernet Barato",
  publisher: "Fernet Barato",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://fernetbarato.com",
    siteName: "Fernet Barato",
    title: "Fernet Barato - Los mejores precios de fernet cerca tuyo",
    description: "Encuentra los mejores precios de fernet en Argentina. Compara precios en tiempo real y ahorra dinero.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fernet Barato - Comparador de precios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@fernetbarato",
    creator: "@fernetbarato",
    title: "Fernet Barato - Los mejores precios de fernet cerca tuyo",
    description: "Encuentra los mejores precios de fernet en Argentina. Compara precios en tiempo real y ahorra dinero.",
    images: ["/twitter-image.jpg"],
  },
  verification: {
    google: "google-site-verification-code",
  },
  alternates: {
    canonical: "https://fernetbarato.com",
  },
  category: "shopping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Fernet Barato",
    "url": "https://fernetbarato.com",
    "description": "Encuentra los mejores precios de fernet en Argentina. Compara precios en tiempo real, encuentra las tiendas más cercanas y ahorra dinero en tu fernet favorito.",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "ARS"
    },
    "author": {
      "@type": "Organization",
      "name": "Fernet Barato Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Fernet Barato",
      "logo": {
        "@type": "ImageObject",
        "url": "https://fernetbarato.com/logo.png"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://fernetbarato.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "serviceType": "Price Comparison",
    "areaServed": {
      "@type": "Country",
      "name": "Argentina"
    }
  };

  return (
    <html lang="es-AR">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PR8VTN3C');`,
          }}
        />
        {/* End Google Tag Manager */}
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="antialiased font-inter">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-PR8VTN3C"
            height="0" 
            width="0" 
            style={{display:'none',visibility:'hidden'}}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
        <JotaiProvider>{children}</JotaiProvider>
      </body>
    </html>
  );
}
