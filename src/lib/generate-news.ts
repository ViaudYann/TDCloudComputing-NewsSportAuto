import type { News } from "@/lib/news";
import { Sports } from "@/lib/sports";
import { appelerModele, ErreurIA } from "@/lib/ai";


const CONSIGNE_SYSTEME = `reviens sur les événements du ou des sports automobiles donnée de cette semaine (uniquement), tu produira une fiche de synthése en français.

Règles :
- La synthèse fait entre 150 et 300 mots. Elle est organisée en courts paragraphes séparés par une ligne vide, et peut contenir des listes dont chaque élément commence par "- ".
- La synthèse s'appuie uniquement sur le contenu de l'article trouvé, sans ajouter d'informations extérieures.
- Tes sources pour chaque discipline seront : 
    F1 : Formula1.com
    endurance : fiawec.com
    motoGp : MotoGP.com
    nascar : nascar.com
    rally : wrc.com
-si plusieurs discipline sont demandées, indique moi quelle discipline n'a pas de news et pour celle qui en ont fais en simplement la synthèse
- les synthèse pour une discipline diffférente ne sont pas séparées elle doit être présentée comme un journal ou type news letter
-en revanche, si toutes les disciplines ont des news, fais la synthèse sans précisé qu'aucune des discipline choisie n'a pas de nnouvelle.
*-idem pour une discipline donnée.`;


const SCHEMA_NEWS = {
  nom: "news_sport_meca",
  schema: {
    type: "object",
    properties: {
      synthese: { type: "string" },
    },
    required: ["synthese"],
    additionalProperties: false,
  },
};

const NOMBRE_TENTATIVES = 2;

type ReponseModele = {
  synthese: string;
};

function estReponseValide(donnees: unknown): donnees is ReponseModele {
  if (typeof donnees !== "object" || donnees === null) return false;
  const d = donnees as Record<string, unknown>;

  return typeof d.synthese === "string" && d.synthese.trim() !== "";
}

async function tenterGeneration(sport: string): Promise<News> {
  const label = Sports.find((s) => s.id === sport)?.label ?? sport;
  const aujourdhui = new Date().toLocaleDateString("fr-FR", {
    dateStyle: "full",
    timeZone: "Europe/Paris",
  });

  const contenu = await appelerModele(
    [
      { role: "system", content: CONSIGNE_SYSTEME },
      { role: "user", content: `Date du jour : ${aujourdhui}\n\nDiscipline : ${label}` },
    ],
    { schema: SCHEMA_NEWS }
  );

  let donnees: unknown;
  try {
    donnees = JSON.parse(contenu);
  } catch {
    throw new ErreurIA("La réponse du modèle n'est pas un JSON valide.", 502);
  }

  if (!estReponseValide(donnees)) {
    throw new ErreurIA("La réponse du modèle ne respecte pas le format attendu.", 502);
  }

  return {
    sport_meca: sport,
    synthese: donnees.synthese.trim(),
    date_creation: new Date().toISOString(),
    statut: "succes",
    message_erreur: null,
  };
}

export async function genererateNews(sport: string): Promise<News> {
  let derniereErreur: unknown;

  for (let tentative = 1; tentative <= NOMBRE_TENTATIVES; tentative++) {
    try {
      return await tenterGeneration(sport);
    } catch (erreur) {
      derniereErreur = erreur;
      const erreurDeFormat =
        erreur instanceof ErreurIA && (erreur.status === 400 || erreur.status === 502);

      if (!erreurDeFormat) throw erreur;
      console.warn(`Tentative ${tentative} échouée pour ${sport} (format de réponse), nouvelle tentative…`);
    }
  }

  throw derniereErreur;
}