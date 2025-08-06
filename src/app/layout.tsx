import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/inwentura/auth";

export const metadata: Metadata = {
  title: "Inwentura - Zarządzanie inwentarzem",
  description: "Aplikacja do zarządzania inwentarzem z rozpoznawaniem mowy",
  keywords: ["inwentura", "inventory", "voice recognition", "Next.js", "TypeScript", "Polish"],
  authors: [{ name: "Inwentura Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Inwentura",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Inwentura - Zarządzanie inwentarzem",
    description: "Aplikacja do zarządzania inwentarzem z rozpoznawaniem mowy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inwentura - Zarządzanie inwentarzem",
    description: "Aplikacja do zarządzania inwentarzem z rozpoznawaniem mowy",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Inwentura",
    "application-name": "Inwentura",
    "msapplication-config": "/browserconfig.xml",
    "msapplication-TileColor": "#000000",
    "msapplication-tap-highlight": "no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body
        className="antialiased bg-background text-foreground"
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('ServiceWorker registration failed: ', error);
                    });
                });
              }
              
              // Handle online/offline status
              window.addEventListener('online', () => {
                document.body.classList.remove('offline');
                console.log('App is online');
              });
              
              window.addEventListener('offline', () => {
                document.body.classList.add('offline');
                console.log('App is offline');
              });
              
              // Check initial status
              if (!navigator.onLine) {
                document.body.classList.add('offline');
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
