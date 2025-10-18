import type { Metadata } from "next";
import "./global.css";
export const metadata: Metadata = {
  title: "Viaggi App",
  description: "App per la gestione dei viaggi",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body cz-shortcut-listen="true">
        {children}
      </body>
    </html>
  );
}
