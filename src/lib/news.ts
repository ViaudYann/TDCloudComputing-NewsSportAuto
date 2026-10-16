export type News = {
  sport_meca: string;
  synthese: string | null;
  date_creation: string;
  statut: "en_cours" | "succes" | "erreur";
  message_erreur: string | null;
};