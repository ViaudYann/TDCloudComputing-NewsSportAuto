import Link from "next/link";
import { notFound } from "next/navigation";
import AffichageNews from "@/components/AffichageNews";
import type { NewsEnregistree } from "@/lib/news";
import { Sports } from "@/lib/sports";
import { creerClientServeur } from "@/lib/supabase/server";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import RafraichissementAuto from "@/components/RafraichissementAuto";

export default async function DetailNews({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await creerClientServeur();
  const { data: news } = await supabase
    .from("news_sport_meca")
    .select("id, sport_meca, synthese, date_creation, statut, message_erreur")
    .eq("id", id)
    .maybeSingle<NewsEnregistree>();

  if (!news) {
    notFound();
  }

  const label = Sports.find((s) => s.id === news.sport_meca)?.label ?? news.sport_meca;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/news" className="text-blue-600 underline">
        ← Retour à mes news
      </Link>
      <p className="mt-4 text-sm text-gray-500">
        Demandée le {new Date(news.date_creation).toLocaleDateString("fr-FR")}
      </p>

      {news.statut === "succes" && <AffichageNews news={news} />}

      {news.statut === "en_cours" && (
  <div className="mt-6 rounded-2xl border border-zinc-200 p-8 dark:border-zinc-800">
    <AITextLoading
      texts={[
        "Recherche des résultats…",
        "Lecture des classements…",
        "Rédaction de la synthèse…",
      ]}
      interval={2200}
      label={`Génération de la news « ${label} » en cours`}
      className="justify-start text-xl font-semibold"
    />
    <p className="mt-3 text-sm text-zinc-500">
      La page se met à jour automatiquement dès que la synthèse est prête.
    </p>
    <RafraichissementAuto />
  </div>
)}

      {news.statut === "erreur" && (
        <p className="mt-6 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          La génération de la news « {label} » a échoué :{" "}
          {news.message_erreur ?? "erreur inconnue"}.
        </p>
      )}
    </main>
  );
}