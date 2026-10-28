import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { genererateNews } from "@/lib/generate-news";
import { ErreurIA, messageErreurIA } from "@/lib/ai";
import { NOMBRE_REESSAIS } from "@/lib/qstash";
import { creerClientAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60; // laisse le temps à l'IA de chercher sur le web

function estReessayable(erreur: unknown): boolean {
  if (erreur instanceof ErreurIA) {
    return erreur.status === 429 || erreur.status >= 500;
  }
  // Délai dépassé, panne réseau ou erreur inattendue : une nouvelle tentative peut réussir
  return true;
}

async function traiter(request: Request) {
  const { newsId } = await request.json();
  const tentative = Number(request.headers.get("Upstash-Retried") ?? "0");

  // Le worker n'a pas d'utilisateur connecté : il utilise le client administrateur
  const supabase = creerClientAdmin();

  const { data: news } = await supabase
    .from("news_sport_meca")
    .select("id, sport_meca, statut")
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

    return Response.json({ resultat: "succès" });
  } catch (erreur) {
    console.error(`Échec de la génération (tentative ${tentative + 1}) :`, erreur);

    // Erreur passagère et tentatives restantes : on demande à QStash de réessayer
    if (estReessayable(erreur) && tentative < NOMBRE_REESSAIS) {
      return Response.json({ resultat: "nouvelle tentative" }, { status: 500 });
    }

    // Erreur définitive ou dernière tentative : on enregistre l'échec
    await supabase
      .from("news_sport_meca")
      .update({ statut: "erreur", message_erreur: messageErreurIA(erreur) })
      .eq("id", news.id);

    return Response.json({ resultat: "erreur" });
  }
}

export const POST = verifySignatureAppRouter(traiter);