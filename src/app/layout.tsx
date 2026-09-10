import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import "./globals.css";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Codeflow",
  description: "Painel técnico de tarefas, branches e conhecimento",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${body.variable} ${mono.variable} h-full`}>
      <body className="min-h-full">
        <AppShell>
          <Sidebar />
          <div className="app-main">
            <Header />
            <div className="app-content">{children}</div>
          </div>
        </AppShell>
      </body>
    </html>
  );
}
