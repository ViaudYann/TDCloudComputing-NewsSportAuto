import type { News } from "@/lib/news";
import { Sports } from "@/lib/sports";

export default function AffichageNews({ news }: { news: News }) {
  const label = Sports.find((s) => s.id === news.sport_meca)?.label ?? news.sport_meca;
  const date = new Date(news.date_creation).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  });

  return (
    <article className="mt-6 rounded-lg border p-6">
      <h2 className="text-2xl font-bold">{label}</h2>
      <p className="mt-1 text-sm text-gray-500">News demandée le {date}</p>

      {news.statut === "succes" && (
        <section className="mt-4">
          <h3 className="text-lg font-semibold">Les news de la semaine</h3>
          <p className="mt-2 whitespace-pre-line text-gray-800">{news.synthese}</p>
        </section>
      )}

      {news.statut === "en_cours" && (
        <p className="mt-4 text-gray-600">La synthèse est en cours de génération…</p>
      )}

      {news.statut === "erreur" && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {news.message_erreur ?? "La génération de la news a échoué."}
        </p>
      )}
    </article>
  );
}