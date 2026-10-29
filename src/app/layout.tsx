import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import EnTete from "@/components/EnTete";
import { cn } from "@/lib/utils";
import FournisseurTheme from "@/components/FournisseurTheme";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", figtree.variable)}
    >
      <body className="min-h-full flex flex-col"> <EnTete />{children}</body>
    </html>
  );
}
