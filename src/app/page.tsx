import FormulaireNews from "@/components/FormulaireNews";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <title>Sport Automobile/Moto</title>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">News de la semaine</h1>
        <Link href="/fiches" className="text-blue-600 underline">
          News passées
        </Link>
      </div>
      <p className="mt-2 text-gray-600">
        Sélectionnez une discipline pour obtenir une fiche de synthèse des dernières informations de la semaine de votre sport préféré.
        
        <FormulaireNews />
      </p>
    </main>
  );
}