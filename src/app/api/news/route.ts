import type { SupabaseClient } from "@supabase/supabase-js";
import { Sports } from "@/lib/sports";
import { genererateNews } from "@/lib/generate-news";
import { ErreurIA, messageErreurIA } from "@/lib/ai";
import { limiteurGenerations } from "@/lib/limitation";
import { creerClientServeur } from "@/lib/supabase/server";

export const maxDuration = 60; // laisse le temps à l'IA de chercher sur le web

export async function POST(request: Request) {
  // 0. Vérification de la session
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { erreur: "Votre session a expiré. Reconnectez-vous pour demander des news." },
      { status: 401 }
    );
  }

  // 1. Validation de la discipline choisie
  const body = await request.json();
  const sport =
    Array.isArray(body.sports) && typeof body.sports[0] === "string" ? body.sports[0] : "";

  if (!Sports.some((s) => s.id === sport)) {
    return Response.json({ erreur: "Choisis une discipline." }, { status: 400 });
  }

  // 2. Vérification du quota de l'utilisateur
  const enTetesQuota: Record<string, string> = {};

  try {
    const quota = await limiteurGenerations.limit(user.id);

    enTetesQuota["X-RateLimit-Limit"] = String(quota.limit);
    enTetesQuota["X-RateLimit-Remaining"] = String(quota.remaining);

    if (!quota.success) {
      const secondes = Math.max(1, Math.ceil((quota.reset - Date.now()) / 1000));
      const minutes = Math.ceil(secondes / 60);

      return Response.json(
        {
          erreur: `Vous avez atteint votre quota de ${quota.limit} news par heure. Réessayez dans ${minutes} minute(s).`,
        },
        { status: 429, headers: { ...enTetesQuota, "Retry-After": String(secondes) } }
      );
    }
  } catch (erreur) {
    // Si Redis est indisponible, on laisse passer la requête plutôt que de bloquer
    // tous les utilisateurs : c'est un choix « fail open ».
    console.error("Limitation de débit indisponible :", erreur);
  }

  // 3. Génération de la news par le modèle d'IA
  let news;
  try {
    news = await genererateNews(sport);
  } catch (erreur) {
    await enregistrerEchec(supabase, sport, erreur);
    return reponseErreurIA(erreur);
  }

  // 4. Enregistrement de la news, au nom de l'utilisateur connecté
  try {
    const { data, error } = await supabase
      .from("news_sport_meca")
      .insert({
        sport_meca: news.sport_meca,
        synthese: news.synthese,
        statut: "succes",
      })
      .select("id, sport_meca, synthese, date_creation, statut, message_erreur")
      .single();

    if (error) throw error;

    return Response.json(data, { status: 201, headers: enTetesQuota });
  } catch (erreur) {
    console.error("Erreur lors de l'enregistrement de la news :", erreur);
    return Response.json(
      { erreur: "La news a été générée mais n'a pas pu être enregistrée. Réessayez plus tard." },
      { status: 500 }
    );
  }
}

// Garde une trace en base des générations qui ont échoué
async function enregistrerEchec(supabase: SupabaseClient, sport: string, erreur: unknown) {
  const { error } = await supabase.from("news_sport_meca").insert({
    sport_meca: sport,
    statut: "erreur",
    message_erreur: messageErreurIA(erreur),
  });

  if (error) console.error("Impossible d'enregistrer l'échec :", error);
}

function reponseErreurIA(erreur: unknown) {
  if (erreur instanceof ErreurIA && erreur.status === 429) {
    return Response.json(
      { erreur: "Le quota du service d'IA est atteint. Réessayez dans quelques instants." },
      { status: 429 }
    );
  }

  if (erreur instanceof ErreurIA && (erreur.status === 401 || erreur.status === 403)) {
    return Response.json(
      { erreur: "La clé du service d'IA est invalide. Vérifiez la configuration." },
      { status: 502 }
    );
  }

  if (erreur instanceof Error && erreur.name === "TimeoutError") {
    return Response.json(
      { erreur: "Le service d'IA met trop de temps à répondre. Réessayez plus tard." },
      { status: 504 }
    );
  }

  console.error(erreur);
  return Response.json(
    { erreur: "La génération de la news a échoué. Réessayez plus tard." },
    { status: 502 }
  );
}