import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import DemoBanner from "@/components/DemoBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Football Portal",
  description: "Your favorite team, live scores, standings and transfers in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
