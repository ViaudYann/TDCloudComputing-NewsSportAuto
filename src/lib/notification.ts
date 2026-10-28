import "server-only";
import { Resend } from "resend";
import { Sports } from "@/lib/sports";

const EXPEDITEUR = "News Sport Auto-Moto <onboarding@resend.dev>";

// Remplace les caractères spéciaux HTML : une donnée variable
// ne doit jamais pouvoir injecter de balises dans l'e-mail
function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Notification = {
  destinataire: string;
  newsId: string;
  sport: string;
  statut: "succes" | "erreur";
  messageErreur?: string;
};

export async function envoyerNotification(notification: Notification) {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) {
    throw new Error("La variable RESEND_API_KEY n'est pas définie.");
  }

  const resend = new Resend(cle);
  const lien = `${process.env.APP_URL}/news/${notification.newsId}`;
  const discipline =
    Sports.find((s) => s.id === notification.sport)?.label ?? notification.sport;
  const disciplineHtml = echapperHtml(discipline);

  const reussie = notification.statut === "succes";

  const sujet = reussie
    ? `Vos news ${discipline} de la semaine sont prêtes`
    : `La génération de vos news ${discipline} a échoué`;

  const html = reussie
    ? `<p>Bonjour,</p>
       <p>Votre synthèse des news <strong>${disciplineHtml}</strong> de la semaine est prête.</p>
       <p><a href="${lien}">Lire les news</a></p>`
    : `<p>Bonjour,</p>
       <p>La génération de vos news <strong>${disciplineHtml}</strong> a échoué :
       ${echapperHtml(notification.messageErreur ?? "erreur inconnue")}.</p>
       <p>Vous pouvez réessayer depuis l'application.</p>`;

  const texte = reussie
    ? `Votre synthèse des news ${discipline} de la semaine est prête : ${lien}`
    : `La génération de vos news ${discipline} a échoué. Vous pouvez réessayer depuis l'application.`;

  const { error } = await resend.emails.send({
    from: EXPEDITEUR,
    to: [notification.destinataire],
    subject: sujet,
    html,
    text: texte,
  });

  if (error) {
    throw new Error(`Envoi refusé par Resend : ${error.message}`);
  }
}