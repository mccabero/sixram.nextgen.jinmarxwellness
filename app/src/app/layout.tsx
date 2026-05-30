import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "Jinmarx Wellness Business App",
    template: "%s | Jinmarx Wellness Business App",
  },
  applicationName: "Jinmarx Wellness Business App",
  description: "Massage center business operations and appointment workspace.",
  icons: {
    icon: [
      {
        url: "/images/jinmarx-logo.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/images/jinmarx-logo.png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--color-shell)] text-[var(--color-ink)]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
