import type { Metadata } from "next";
import "./globals.css";

const siteName = process.env.SITE_NAME || "jinxmrcl";

export const metadata: Metadata = {
  title: siteName,
  description: `${siteName} file host`,
  icons: {
    icon: "/favicon.gif",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
