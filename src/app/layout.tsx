import type { Metadata } from "next";
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
  title: "WeChat - WhatsApp-like Chat App",
  description: "A modern WhatsApp-like chat application built with Next.js and Firebase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body className="font-sans h-full antialiased">
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
