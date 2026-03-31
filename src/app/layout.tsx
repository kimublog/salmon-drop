import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ピチピチサーモンタワー",
  description: "空から降ってくるサーモンを積み上げろ！シュールなバランス積み上げアクションゲーム",
  openGraph: {
    title: "ピチピチサーモンタワー",
    description: "空から降ってくるサーモンを積み上げろ！シュールなバランス積み上げアクションゲーム",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ピチピチサーモンタワー",
    description: "空から降ってくるサーモンを積み上げろ！シュールなバランス積み上げアクションゲーム",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
