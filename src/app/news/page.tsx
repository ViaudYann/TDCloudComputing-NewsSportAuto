import Link from "next/link";
import { Sports } from "@/lib/sports";
import { creerClientServeur } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const LIBELLE_STATUT = {
  en_cours: { texte: "En cours", couleur: "text-yellow-700" },
  succes: { texte: "Reçue", couleur: "text-green-700" },
  erreur: { texte: "Erreur", couleur: "text-red-700" },
} as const;

export default async function ListeNews() {
  const supabase = await creerClientServeur();
  const { data: news, error } = await supabase
    .from("news_sport_meca")
    .select("id, sport_meca, date_creation, statut")
    .order("date_creation", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mes news</h1>
        <Link href="/" className="rounded bg-blue-600 px-4 py-2 text-white">
          Nouvelle demande
        </Link>
      </div>

      {error && (
        <p className="mt-6 text-red-700">Impossible de charger les news.</p>
      )}

      {news && news.length === 0 && (
        <p className="mt-6 text-gray-600">Aucune news pour l’instant.</p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {news?.map((n) => {
          const label = Sports.find((s) => s.id === n.sport_meca)?.label ?? n.sport_meca;
          const statut = LIBELLE_STATUT[n.statut as keyof typeof LIBELLE_STATUT];

          return (
            <li key={n.id}>
              <Link
                href={`/news/${n.id}`}
                className="block rounded border p-4 hover:bg-gray-50"
              >
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-500">
                  {new Date(n.date_creation).toLocaleDateString("fr-FR")}
                  {statut && <span className={`ml-2 ${statut.couleur}`}>{statut.texte}</span>}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}