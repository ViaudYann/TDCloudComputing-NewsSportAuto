"use client";

import { useState } from "react";
import Link from "next/link";
import AffichageNews from "@/components/AffichageNews";
import { Sports } from "@/lib/sports";
import type { NewsEnregistree } from "@/lib/news";

export default function FormulaireNews() {
  const [sportChoisi, setSportChoisi] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [news, setNews] = useState<NewsEnregistree | null>(null);
  const [restantes, setRestantes] = useState<number | null>(null);
  const sportsChoisis = Sports.filter((s) => s.id === sportChoisi).map((s) => s.id);
  const formulaireValide = sportsChoisis.length > 0;

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur("");
    setNews(null);

    try {
      const reponse = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sports: sportsChoisis }),
      });
      const donnees = await reponse.json();

      const entete = reponse.headers.get("X-RateLimit-Remaining");
if (entete !== null) setRestantes(Number(entete));

      if (!reponse.ok) {
        setErreur(donnees.erreur ?? "Une erreur est survenue.");
        return;
      }

      setNews(donnees);
      setSportChoisi("");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="mt-6">
      <form onSubmit={envoyer} className="flex flex-col gap-4">
        <fieldset className="rounded border p-4">
          <legend className="font-medium">Discipline</legend>
          {Sports.map((s) => (
            <label key={s.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="sport"
                value={s.id}
                checked={sportChoisi === s.id}
                onChange={(e) => setSportChoisi(e.target.value)}
              />
              {s.label}
            </label>
          ))}
        </fieldset>

        <p className={`text-sm ${formulaireValide ? "text-gray-500" : "text-red-600"}`}>
          {formulaireValide ? "1 discipline sélectionnée" : "Aucune discipline sélectionnée"}
        </p>

        <button
          type="submit"
          disabled={!formulaireValide || chargement}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {chargement ? "Recherche des news en cours…" : "Demander les news"}
        </button>

        {restantes !== null && (
  <p className="text-sm text-gray-500">
    {restantes > 0
      ? `Il vous reste ${restantes} génération(s) pour l'heure en cours.`
      : "Vous avez utilisé tout votre quota pour l'heure en cours."}
  </p>
)}
      </form>

      {erreur && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {erreur}
        </p>
      )}

      {news && (
        <>
          <p className="mt-6 rounded border border-green-300 bg-green-50 p-3 text-green-800">
            News enregistrée.{" "}
            <Link href={`/news/${news.id}`} className="font-medium underline">
              Retrouver cette news
            </Link>
          </p>
          <AffichageNews news={news} />
        </>
      )}
    </div>
  );
}