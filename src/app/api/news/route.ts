import { Sports } from "@/lib/sports";
import { limiteurGenerations } from "@/lib/limitation";
import { publierGeneration } from "@/lib/qstash";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { creerClientServeur } from "@/lib/supabase/server";

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
    console.error("Limitation de débit indisponible :", erreur);
  }

  // 3. Enregistrement de la demande, avec le statut « en cours »
  const { data: news, error } = await supabase
    .from("news_sport_meca")
    .insert({ sport_meca: sport })
    .select("id, sport_meca, synthese, date_creation, statut, message_erreur")
    .single();

  if (error || !news) {
    console.error("Erreur lors de l'enregistrement de la demande :", error);
    return Response.json(
      { erreur: "La demande n'a pas pu être enregistrée. Réessayez plus tard." },
      { status: 500 }
    );
  }

  // 4. Publication du message de génération dans la file
  try {
    await publierGeneration(news.id);
  } catch (erreur) {
    console.error("Erreur lors de la publication du message :", erreur);

    // Traitement système, sans utilisateur : usage légitime du client administrateur
    await creerClientAdmin()
      .from("news_sport_meca")
      .update({ statut: "erreur", message_erreur: "La génération n'a pas pu être lancée." })
      .eq("id", news.id);

    return Response.json(
      { erreur: "La génération n'a pas pu être lancée. Réessayez plus tard." },
      { status: 503 }
    );
  }

  // 5. Réponse immédiate : la demande est acceptée, le traitement suivra
  return Response.json(news, { status: 202, headers: enTetesQuota });
}