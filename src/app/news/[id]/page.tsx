import Link from "next/link";
import { notFound } from "next/navigation";
import AffichageNews from "@/components/AffichageNews";
import type { NewsEnregistree } from "@/lib/news";
import { Sports } from "@/lib/sports";
import { creerClientServeur } from "@/lib/supabase/server";

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
        <p className="mt-6 rounded border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
          La news « {label} » est en cours de génération. Rechargez la page dans
          quelques instants.
        </p>
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