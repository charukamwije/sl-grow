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
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

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
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_LK",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#166534",
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
    <html lang="en">
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
                  <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
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
