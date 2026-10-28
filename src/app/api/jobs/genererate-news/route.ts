import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { envoyerNotification } from "@/lib/notification";
import { genererateNews } from "@/lib/generate-news";
import { ErreurIA, messageErreurIA } from "@/lib/ai";
import { NOMBRE_REESSAIS } from "@/lib/qstash";
import { creerClientAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60; // laisse le temps à l'IA de chercher sur le web

type ClientAdmin = ReturnType<typeof creerClientAdmin>;

function estReessayable(erreur: unknown): boolean {
  if (erreur instanceof ErreurIA) {
    return erreur.status === 429 || erreur.status >= 500;
  }
  // Délai dépassé, panne réseau ou erreur inattendue : une nouvelle tentative peut réussir
  return true;
}

// Effet secondaire : un échec d'envoi est journalisé, mais ne fait jamais échouer le traitement
async function notifier(
  supabase: ClientAdmin,
  news: { id: string; sport_meca: string; user_id: string },
  statut: "succes" | "erreur",
  messageErreur?: string
) {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(news.user_id);
    const destinataire = data.user?.email;

    if (error || !destinataire) {
      throw new Error("Adresse e-mail de l'auteur introuvable.");
    }

    await envoyerNotification({
      destinataire,
      newsId: news.id,
      sport: news.sport_meca,
      statut,
      messageErreur,
    });
  } catch (erreur) {
    console.error("Échec de l'envoi de la notification :", erreur);
  }
}

async function traiter(request: Request) {
  const { newsId } = await request.json();
  const tentative = Number(request.headers.get("Upstash-Retried") ?? "0");

  // Le worker n'a pas d'utilisateur connecté : il utilise le client administrateur
  const supabase = creerClientAdmin();

  const { data: news } = await supabase
    .from("news_sport_meca")
    .select("id, sport_meca, statut, user_id")
    .eq("id", newsId)
    .maybeSingle();

  // Idempotence : une news absente ou déjà traitée n'est pas générée une seconde fois
  if (!news || news.statut !== "en_cours") {
    return Response.json({ resultat: "ignoré" });
  }

  try {
    const resultat = await genererateNews(news.sport_meca);

    await supabase
      .from("news_sport_meca")
      .update({
        synthese: resultat.synthese,
        statut: "succes",
      })
      .eq("id", news.id);

    await notifier(supabase, news, "succes");

    return Response.json({ resultat: "succès" });
  } catch (erreur) {
    console.error(`Échec de la génération (tentative ${tentative + 1}) :`, erreur);

    // Erreur passagère et tentatives restantes : on demande à QStash de réessayer
    if (estReessayable(erreur) && tentative < NOMBRE_REESSAIS) {
      return Response.json({ resultat: "nouvelle tentative" }, { status: 500 });
    }

    // Erreur définitive ou dernière tentative : on enregistre l'échec et on prévient l'auteur
    const message = messageErreurIA(erreur);

    await supabase
      .from("news_sport_meca")
      .update({ statut: "erreur", message_erreur: message })
      .eq("id", news.id);

    await notifier(supabase, news, "erreur", message);

    return Response.json({ resultat: "erreur" });
  }
}

export const POST = verifySignatureAppRouter(traiter);