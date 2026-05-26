import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "macOS on Web",
  description: "A macOS-style web simulator built as a public proof-of-work artifact.",
  metadataBase: new URL("https://example.com"),
  icons: {
    icon: "/app-icons/finder.svg",
    shortcut: "/app-icons/finder.svg",
    apple: "/app-icons/finder.svg",
  },
  openGraph: {
    title: "macOS on Web",
    description: "A macOS-style web simulator built as a public proof-of-work artifact.",
    type: "website",
    images: [
      {
        url: "/og/macos-on-web-og.svg",
        width: 1200,
        height: 630,
        alt: "macOS on Web desktop-style simulator.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "macOS on Web",
    description: "A macOS-style web simulator built as a public proof-of-work artifact.",
    images: ["/og/macos-on-web-og.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full overflow-hidden">{children}</body>
    </html>
  );
}
