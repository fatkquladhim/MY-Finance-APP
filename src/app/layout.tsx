import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import Header from "@/components/Header";
import ChatWidgetWrapper from "@/components/chat/ChatWidgetWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "My Finance Manager - AI Powered",
  description: "Personal finance dashboard with AI-powered financial advisor",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 min-h-screen`}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Header />
              <main className="pb-20">{children}</main>
              <ChatWidgetWrapper />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
