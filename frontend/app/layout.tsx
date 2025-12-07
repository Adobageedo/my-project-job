import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/shared/Toast";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FinanceStages - Stages et Alternances en Finance",
  description: "La plateforme de référence pour les stages et alternances en finance",
  keywords: "stage finance, alternance finance, banque, M&A, audit, private equity",
  authors: [{ name: "FinanceStages" }],
  openGraph: {
    title: "FinanceStages - Stages et Alternances en Finance",
    description: "La plateforme de référence pour les stages et alternances en finance",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
