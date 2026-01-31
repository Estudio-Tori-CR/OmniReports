import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./clientLayaout";
export const metadata: Metadata = {
  title: "Omni Reports",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
