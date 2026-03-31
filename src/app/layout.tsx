import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "サモドロ — サーモンパズルバトル",
  description: "リアルなサーモンで遊ぶぷよぷよ風パズルゲーム。8種類のサーモンを見分けて連鎖を決めろ！",
  openGraph: {
    title: "サモドロ — サーモンパズルバトル",
    description: "リアルなサーモンで遊ぶぷよぷよ風パズルゲーム。8種類のサーモンを見分けて連鎖を決めろ！",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "サモドロ — サーモンパズルバトル",
    description: "リアルなサーモンで遊ぶぷよぷよ風パズルゲーム。8種類のサーモンを見分けて連鎖を決めろ！",
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
