"use client";

import { useState } from "react";
import {type News } from "@/lib/news";
import { Sports } from "@/lib/sports";

export default function FormulaireNews() {
  const [coches, setCoches] = useState<Record<string, boolean>>({});
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [news, setNews] = useState<News[]>([]);

  // Compréhension : les id des sports dont la case est cochée
  const sportsChoisis = Sports.filter((s) => coches[s.id]).map((s) => s.id);
  const formulaireValide = sportsChoisis.length > 0;

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur("");
    setNews([]);

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

      setNews(donnees);
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
          <legend className="font-medium">Disciplines</legend>
          {Sports.map((s) => (
            <label key={s.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={coches[s.id] ?? false}
                onChange={(e) => setCoches({ ...coches, [s.id]: e.target.checked })}
              />
              {s.label}
            </label>
          ))}
        </fieldset>

        <p className={`text-sm ${formulaireValide ? "text-gray-500" : "text-red-600"}`}>
          {sportsChoisis.length} discipline(s) sélectionnée(s)
        </p>

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

      {news.map((n) => (
        <div className="mt-4 rounded bg-gray-100 p-4 text-gray-800">
          <h3 className="font-medium">
            {Sports.find((s) => s.id === n.sport_meca)?.label}
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {n.statut === "succes" ? n.synthese : n.message_erreur}
          </p>
        </div>
      ))}
    </div>
  );
}