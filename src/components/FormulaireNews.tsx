"use client";

import { useState } from "react";
import Link from "next/link";
import ParticleButton from "@/components/kokonutui/particle-button";
import { Sports } from "@/lib/sports";
import type { NewsEnregistree } from "@/lib/news";

export default function FormulaireNews() {
  const [sportChoisi, setSportChoisi] = useState("");
  const [erreur, setErreur] = useState("");
  const [news, setNews] = useState<NewsEnregistree | null>(null);

  const sportsChoisis = Sports.filter((s) => s.id === sportChoisi).map((s) => s.id);
  const formulaireValide = sportsChoisis.length > 0;

  // Renvoie une promesse : le ParticleButton affiche l'attente, puis le succès
  // ou l'erreur selon qu'elle est résolue ou rejetée.
  async function envoyer() {
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
        throw new Error(donnees.erreur ?? "Une erreur est survenue.");
      }

      setNews(donnees);
      setSportChoisi("");
    } catch (e) {
      setErreur(
        e instanceof TypeError
          ? "Impossible de contacter le serveur."
          : (e as Error).message
      );
      throw e;
    }
  }

  return (
    <div>
      <fieldset>
        <legend className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Discipline
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Sports.map((s) => (
            <label key={s.id} className="cursor-pointer">
              <input
                type="radio"
                name="sport"
                value={s.id}
                checked={sportChoisi === s.id}
                onChange={(e) => setSportChoisi(e.target.value)}
                className="peer sr-only"
              />
              <span className="flex h-full items-center justify-center rounded-xl border border-zinc-200 px-4 py-3 text-center text-sm font-medium transition-colors hover:border-zinc-400 peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500 peer-focus-visible:ring-offset-2 dark:border-zinc-800 dark:hover:border-zinc-600">
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <ParticleButton
          onClick={envoyer}
          disabled={!formulaireValide}
          pendingLabel="Recherche en cours"
          successLabel="Demande envoyée"
          errorLabel="Réessayer"
          className="h-11 rounded-full bg-orange-500 px-6 text-white hover:bg-orange-600 disabled:opacity-40"
        >
          Demander les news
        </ParticleButton>
        {!formulaireValide && (
          <p className="text-sm text-zinc-500">Choisissez une discipline pour continuer.</p>
        )}
      </div>

      {erreur && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {erreur}
        </p>
      )}

      {news && (
        <p className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Demande enregistrée, la synthèse est en cours de génération. Vous recevrez un
          e-mail dès qu’elle sera prête.{" "}
          <Link href={`/news/${news.id}`} className="font-medium underline">
            Suivre cette news
          </Link>
        </p>
      )}
    </div>
  );
}