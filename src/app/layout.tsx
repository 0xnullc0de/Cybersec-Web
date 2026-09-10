import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { siteConfig } from "@/data/siteConfig";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://nullbyte.vercel.app'
);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} | Offensive Security & CTF Writeup Vault`,
    template: `%s | ${siteConfig.handle}`,
  },
  description: siteConfig.bio,
  keywords: [
    "offensive security",
    "hackthebox writeups",
    "tryhackme writeups",
    "red teaming",
    "active directory",
    "penetration testing",
    "OSCP",
    "CRTO",
    "HTB Pro Labs",
    "Nullbyt3",
    "CTF walkthroughs",
  ],
  authors: [{ name: siteConfig.name, url: siteUrl }],
  creator: siteConfig.handle,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: `${siteConfig.name} | Offensive Security & CTF Writeup Vault`,
    description: siteConfig.bio,
    siteName: `${siteConfig.handle} Security Vault`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Offensive Security Vault`,
    description: siteConfig.bio,
    creator: "@Nullbyt3_sec",
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
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
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
      </head>
      <body className="min-h-screen flex flex-col selection:bg-[#00ff66]/20 selection:text-[#00ff66] antialiased">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
