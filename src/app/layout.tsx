import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppFrame } from "@/components/layout/app-frame";
import "./globals.css";

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Code Flow",
  description: "Painel técnico de tarefas, branches e conhecimento",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${body.variable} ${mono.variable} h-full`}>
      <body className="min-h-full">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
