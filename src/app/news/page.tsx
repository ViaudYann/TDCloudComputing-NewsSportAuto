import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { Sports } from "@/lib/sports";

export const dynamic = "force-dynamic";

export default async function ListeNews() {
  const supabase = await creerClientServeur();
  const { data: news, error } = await supabase
    .from("news_sport_meca")
    .select("id, sport_meca, synthese, date_creation, statut")
    .order("date_creation", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-orange-600">
            Historique
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Mes news</h1>
        </div>
        <Link
          href="/"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          Nouvelle demande
        </Link>
      </div>

      {error && <p className="mt-10 text-red-700">Impossible de charger les news.</p>}

      {news && news.length === 0 && (
        <p className="mt-10 text-zinc-500">Aucune news pour l’instant.</p>
      )}

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {news?.map((n) => {
          const label = Sports.find((s) => s.id === n.sport_meca)?.label ?? n.sport_meca;

          return (
            <li key={n.id}>
              <Link
                href={`/news/${n.id}`}
                className="flex h-full flex-col rounded-2xl border border-zinc-200 p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                  <span className="uppercase tracking-widest">
                    {new Date(n.date_creation).toLocaleDateString("fr-FR")}
                  </span>
                  {n.statut !== "succes" && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-medium ${
                        n.statut === "en_cours"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {n.statut === "en_cours" ? "En cours de génération" : "Échec"}
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{label}</h2>
                {n.synthese && (
                  <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {n.synthese}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}