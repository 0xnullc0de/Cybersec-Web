import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { siteConfig } from "@/data/siteConfig";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://0xnullc0de.vercel.app'
);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} | Offensive Security & CTF Writeup Vault`,
    template: `%s | ${siteConfig.handle}`,
  },
  description: siteConfig.bio,
  keywords: [
    "0xnullc0de",
    "0xnullcode",
    "0xnulllc0de",
    "nullc0de",
    "nullcode",
    "Maxwell Wachira",
    "Maxwell Wachira cybersecurity",
    "0xnullc0de writeups",
    "0xnullcode writeups",
    "Nullbyt3",
    "offensive security",
    "hackthebox writeups",
    "tryhackme writeups",
    "red teaming",
    "active directory",
    "penetration testing",
    "OSCP",
    "CRTO",
    "HTB Pro Labs",
    "CTF walkthroughs",
  ],
  authors: [{ name: "0xnullc0de (Maxwell Wachira)", url: siteUrl }],
  creator: "0xnullc0de",
  publisher: "0xnullc0de",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: `${siteConfig.name} | Offensive Security & CTF Writeup Vault`,
    description: siteConfig.bio,
    siteName: "0xnullc0de Security Vault",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Offensive Security Vault`,
    description: siteConfig.bio,
    creator: "@MaxwellWac79412",
  },
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "8uzwpQ-o5l3vtc1LF1RY53Yeq5C7mOxyhZNEWAHVuok",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050708",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  "url": siteUrl,
                  "name": "0xnullc0de | Offensive Security & CTF Vault",
                  "alternateName": ["0xnullcode", "0xnulllc0de", "0xnullc0de Vault", "0xnullc0de.github.io"],
                  "description": siteConfig.bio,
                  "publisher": {
                    "@id": `${siteUrl}/#person`
                  }
                },
                {
                  "@type": "Person",
                  "@id": `${siteUrl}/#person`,
                  "name": "Maxwell Wachira",
                  "alternateName": ["0xnullc0de", "0xnullcode", "0xnulllc0de", "Nullbyt3"],
                  "url": siteUrl,
                  "jobTitle": "Offensive Security Practitioner & Red Team Researcher",
                  "sameAs": [
                    "https://github.com/0xnullc0de",
                    "https://0xnullc0de.github.io",
                    "https://www.linkedin.com/in/maxwell-wachira-05b991344/",
                    "https://x.com/MaxwellWac79412",
                    "https://app.hackthebox.com/users/2029291",
                    "https://tryhackme.com/p/Nullbyt3"
                  ]
                }
              ]
            })
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col selection:bg-[#00ff66]/20 selection:text-[#00ff66] antialiased">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
