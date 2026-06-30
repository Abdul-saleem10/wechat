import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme.provider";
import { AuthInitializer } from "@/providers/auth-initializer";
import { Toaster } from "react-hot-toast";

const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "WeChat - WhatsApp-like Chat App",
    template: "%s | WeChat",
  },
  description:
    "A modern WhatsApp-like chat application built with Next.js and Firebase. Real-time messaging, voice messages, media sharing, and group chats.",
  keywords: [
    "wechat",
    "chat",
    "messaging",
    "whatsapp",
    "firebase",
    "nextjs",
    "real-time",
    "group chat",
  ],
  authors: [{ name: "WeChat Team" }],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "WeChat",
    title: "WeChat - WhatsApp-like Chat App",
    description:
      "A modern WhatsApp-like chat application with real-time messaging, voice messages, media sharing, and group chats.",
    images: [{ url: "/icon-512.svg", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WeChat - WhatsApp-like Chat App",
    description:
      "A modern WhatsApp-like chat application with real-time messaging, voice messages, media sharing, and group chats.",
    images: ["/icon-512.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    title: "WeChat",
    statusBarStyle: "black-translucent",
  },
  applicationName: "WeChat",
  category: "communication",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body className="font-sans h-full antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('wechat-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/firebase-messaging-sw.js');
                });
              }
            `,
          }}
        />
        <ThemeProvider>
          <AuthInitializer>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
          </AuthInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}
