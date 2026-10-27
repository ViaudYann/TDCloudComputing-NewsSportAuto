import Link from "next/link";
import FormulaireNews from "@/components/FormulaireNews";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <title>News Sport Auto-Moto</title>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">News Sport Auto-Moto</h1>
        <Link href="/news" className="text-blue-600 underline">
          Mes news
        </Link>
      </div>
      <p className="mt-2 text-gray-600">
        Choisissez une discipline et obtenez une synthèse des actualités de la semaine.
      </p>
      <FormulaireNews />
    </main>
  );
}