"use client";

import { useState } from "react";
import {type News } from "@/lib/news";
import { Sports } from "@/lib/sports";
import AffichageNews from "@/components/AffichageNews";

export default function FormulaireNews() {
  const [sportChoisi, setSportChoisi] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [news, setNews] = useState<News | null>(null);

  // Compréhension : les id des sports dont la case est cochée
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

      if (!reponse.ok) {
        setErreur(donnees.erreur ?? "Une erreur est survenue.");
        return;
      }

      setNews(donnees[0] ?? null);
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

        <button
          type="submit"
          disabled={!formulaireValide || chargement}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {chargement ? "Recherche des news en cours…" : "Demander les news"}
        </button>
      </form>

      {erreur && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {erreur}
        </p>
      )}

      {news && <AffichageNews news={news} />}
    </div>
  );
}