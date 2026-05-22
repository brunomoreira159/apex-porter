import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeColorUpdater from "@/components/theme-color-updater";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "APEX Porter - Sistema de Registro",
  description: "Sistema de registro de entrada e saída para controle de acesso",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icone-site.png", sizes: "any", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icone-site.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "APEX Porter",
  },
  formatDetection: {
    telephone: false,
  },
  applicationName: "APEX Porter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icone-site.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APEX Porter" />
        <meta name="application-name" content="APEX Porter" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-navbutton-color" content="#059669" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ThemeColorUpdater />
          <div id="app-scroll-root">
            {children}
          </div>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        <Script
          id="pwa-helpers"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // ── Pull-to-refresh blocker for PWA ──
              // Prevents the browser from refreshing when user pulls down
              (function() {
                var scrollRoot = null;
                var touchStartY = 0;

                function getScrollRoot() {
                  if (!scrollRoot) scrollRoot = document.getElementById('app-scroll-root');
                  return scrollRoot;
                }

                document.addEventListener('touchstart', function(e) {
                  touchStartY = e.touches[0].clientY;
                }, { passive: true });

                document.addEventListener('touchmove', function(e) {
                  var root = getScrollRoot();
                  if (!root) return;

                  var touchY = e.touches[0].clientY;
                  var diff = touchY - touchStartY;

                  // If pulling down AND already at top of scroll, prevent default
                  if (diff > 0 && root.scrollTop <= 0) {
                    e.preventDefault();
                  }
                }, { passive: false });

                // Also block overscroll on the scroll root itself
                document.addEventListener('DOMContentLoaded', function() {
                  var root = getScrollRoot();
                  if (root) {
                    root.addEventListener('touchmove', function(e) {
                      if (root.scrollTop <= 0 && e.touches[0].clientY > touchStartY) {
                        e.preventDefault();
                      }
                    }, { passive: false });
                  }
                });
              })();

              // ── Service Worker ──
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registrado com sucesso:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('Falha ao registrar SW:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
