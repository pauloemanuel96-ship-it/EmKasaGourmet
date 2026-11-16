import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PwaRegister } from "@/components/pwa-register";
import { siteUrl } from "@/lib/site";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Fontes self-hosted (sem chamada ao Google Fonts no build nem no navegador).
const fraunces = localFont({
  src: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  display: "swap",
});

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Emkasa Gourmet",
    template: "%s · Emkasa Gourmet",
  },
  description:
    "Alimentação saudável da Chef Angela Acioli: horta, cozinha e produtos próprios, BOX para a sua casa e ceias sob encomenda.",
  applicationName: "Emkasa Gourmet",
  openGraph: {
    type: "website",
    siteName: "Emkasa Gourmet",
    locale: "pt_BR",
    title: "Emkasa Gourmet",
    description: "Alimentar é uma forma de cuidar.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: { card: "summary" },
  appleWebApp: {
    capable: true,
    title: "Emkasa",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#faf6ee",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
