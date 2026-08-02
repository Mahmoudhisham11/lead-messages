import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import PageLoader from "@/components/PageLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Lead Messages - Professional Lead Management",
  description: "Manage and send WhatsApp messages to your leads quickly and efficiently.",

  manifest: "/site.webmanifest",

  themeColor: "#ffffff",

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lead Messages",
  },

  applicationName: "Lead Messages",

  keywords: [
    "Lead Messages",
    "WhatsApp",
    "Lead Management",
    "CRM",
    "Messaging",
    "Business",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <body style={{ colorScheme: "light" }}>
        <AuthProvider>
          <PageLoader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}