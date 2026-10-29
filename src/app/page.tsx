import Link from "next/link";
import type { Metadata } from "next";
import BackgroundPaths from "@/components/kokonutui/background-paths";
import SplitFlapText from "@/components/kokonutui/split-flap-text";
import BoutonTheme from "@/components/BoutonTheme";
import FormulaireNews from "@/components/FormulaireNews";

export const metadata: Metadata = {
  title: "News Sport Auto-Moto",
};

export default function Home() {
  return (
    <main>
      <BackgroundPaths className="min-h-screen px-6 py-16" speed={0.6} angle={-6}>
        <div className="relative w-full max-w-3xl">
          <nav className="mb-16 flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold tracking-tight">News Sport Auto-Moto</span>
            <div className="flex items-center gap-2">
              <Link
                href="/news"
                className="rounded-full border border-zinc-300 px-4 py-2 transition-colors hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:hover:bg-zinc-50 dark:hover:text-zinc-900"
              >
                Mes news
              </Link>
              <BoutonTheme />
            </div>
          </nav>

          <SplitFlapText
            words={["FORMULE 1", "MOTOGP", "RALLYE WRC", "ENDURANCE", "NASCAR"]}
            interval={3000}
            className="text-xl sm:text-3xl"
            tileClassName="bg-zinc-900 text-orange-400"
          />
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
            Toute l’actu du week-end, en une synthèse.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Choisissez une discipline : l’IA parcourt les résultats des 7 derniers jours
            et vous prévient par e-mail dès que c’est prêt.
          </p>

          <div className="mt-10 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:p-8">
            <FormulaireNews />
          </div>
        </div>
      </BackgroundPaths>
    </main>
  );
}