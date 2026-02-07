import { Inter } from "next/font/google";
import "@/app/globals.css";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import TopNavbar from "@/components/layout/TopNavbar";
import BottomNavbar from "@/components/layout/BottomNavbar";
import ChatWidgetWrapper from "@/components/chat/ChatWidgetWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinanceApp - AI Powered Personal Finance",
  description: "Personal finance dashboard with AI-powered financial advisor",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-dark-bg-primary min-h-screen`}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <TopNavbar />
              <BottomNavbar />
              {children}
              <ChatWidgetWrapper />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
