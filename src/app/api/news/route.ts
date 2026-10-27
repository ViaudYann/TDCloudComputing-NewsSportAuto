import { Sports } from "@/lib/sports";
import { genererateNews } from "@/lib/generate-news";
import { ErreurIA, messageErreurIA } from "@/lib/ai";
import { creerClientSupabase } from "@/lib/supabase";

export const maxDuration = 60; // laisse le temps à l'IA de chercher sur le web

export async function POST(request: Request) {
  const body = await request.json();
  const sport =
    Array.isArray(body.sports) && typeof body.sports[0] === "string" ? body.sports[0] : "";

  if (!Sports.some((s) => s.id === sport)) {
    return Response.json({ erreur: "Choisis une discipline." }, { status: 400 });
  }

  // 1. Génération de la news par le modèle d'IA
  let news;
  try {
    news = await genererateNews(sport);
  } catch (erreur) {
    await enregistrerEchec(sport, erreur);
    return reponseErreurIA(erreur);
  }

  // 2. Enregistrement de la news dans la base de données
  try {
    const supabase = creerClientSupabase();
    const { data, error } = await supabase
      .from("news_sport_meca")
      .insert({
        sport_meca: news.sport_meca,
        synthese: news.synthese,
        statut: "succes",
      })
      .select("sport_meca, synthese, date_creation, statut, message_erreur")
      .single();

    if (error) throw error;

    return Response.json(data, { status: 201 });
  } catch (erreur) {
    console.error("Erreur lors de l'enregistrement de la news :", erreur);
    return Response.json(
      { erreur: "La news a été générée mais n'a pas pu être enregistrée. Réessayez plus tard." },
      { status: 500 }
    );
  }
}

// Garde une trace en base des générations qui ont échoué
async function enregistrerEchec(sport: string, erreur: unknown) {
  try {
    const supabase = creerClientSupabase();
    await supabase.from("news_sport_meca").insert({
      sport_meca: sport,
      statut: "erreur",
      message_erreur: messageErreurIA(erreur),
    });
  } catch (e) {
    console.error("Impossible d'enregistrer l'échec :", e);
  }
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