import type { Metadata, Viewport } from "next";
import { Geist, Noto_Sans_Sinhala, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/contexts/notification-context";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { CartProvider } from "@/contexts/cart-context";
import { SessionProvider } from "@/contexts/session-context";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getServerUser } from "@/lib/firebase/auth-server";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";

// Fonts are downloaded at build time and served from this site, so the page
// makes no request to Google Fonts at runtime (NFR-08)
const latin = Geist({ variable: "--font-latin", subsets: ["latin"] });
const sinhala = Noto_Sans_Sinhala({
  variable: "--font-sinhala",
  subsets: ["sinhala"],
});
const tamil = Noto_Sans_Tamil({ variable: "--font-tamil", subsets: ["tamil"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_SHORT_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_LK",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  // Lets the bottom bars pad themselves clear of the iPhone home indicator
  viewportFit: "cover",
};

// Every page depends on the session cookie for the header and cart sync
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerUser();

  return (
    // `suppressHydrationWarning`: the inline script below adds the `js` class
    // before React hydrates, which would otherwise read as a mismatch
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Lets CSS hide scroll-reveal content only when script is running */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add(\"js\")",
          }}
        />
      </head>
      <body
        className={`${latin.variable} ${sinhala.variable} ${tamil.variable} antialiased`}
      >
        <SessionProvider
          user={
            user
              ? {
                  uid: user.uid,
                  displayName: user.displayName,
                  email: user.email,
                }
              : null
          }
          accountsEnabled={isFirebaseConfigured()}
        >
          <NotificationProvider>
            <LanguageProvider>
              <AuthProvider>
                <CartProvider uid={user?.uid ?? null}>
                  <div className="flex min-h-screen flex-col overflow-x-clip">
                    <Header />
                    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 md:pt-8">
                      {children}
                    </main>
                    <Footer />
                  </div>
                </CartProvider>
              </AuthProvider>
            </LanguageProvider>
          </NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
