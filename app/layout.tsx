import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { CharacterProvider } from "@/contexts/CharacterContext";
import { UserProvider } from "@/contexts/UserContext";
import { YearProvider } from "@/contexts/YearContext";
// import ClientListener from "@/components/ClientListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RPAVER",
  description: "Welcom Spawner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <UserProvider>
            <CharacterProvider>
              <YearProvider>
                <Navbar />
                <div className="mt-16">
                  {/* <ClientListener /> */}
                  {children}
                </div>
              </YearProvider>
            </CharacterProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
