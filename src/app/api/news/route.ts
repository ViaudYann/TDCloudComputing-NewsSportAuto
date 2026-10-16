import { Sports } from "@/lib/sports";
import type { News } from "@/lib/news";
import { genererateNews } from "@/lib/generate-news";
import { messageErreurIA } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
  const sports: string[] = Array.isArray(body.sports)
    ? body.sports.filter((id: unknown) => Sports.some((s) => s.id === id))
    : [];

  if (sports.length === 0) {
    return Response.json(
      { erreur: "Choisis au moins une discipline." },
      { status: 400 }
    );
  }

  const news = await Promise.all(
    sports.map(async (sport): Promise<News> => {
      try {
        return await genererateNews(sport);
      } catch (erreur) {
        return {
          sport_meca: sport,
          synthese: null,
          date_creation: new Date().toISOString(),
          statut: "erreur",
          message_erreur: messageErreurIA(erreur),
        };
      }
    })
  );

  return Response.json(news);
}