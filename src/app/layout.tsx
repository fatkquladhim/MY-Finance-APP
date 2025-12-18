import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import Header from "@/components/Header";
import Toast from "@/components/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "My Finance Manager",
  description: "Personal finance dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Header />
              {children}
              <Toast />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}