import Link from "next/link";
import { notFound } from "next/navigation";
import AffichageNews from "@/components/AffichageNews";
import type { NewsEnregistree } from "@/lib/news";
import { creerClientSupabase } from "@/lib/supabase";

export default async function DetailNews({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = creerClientSupabase();
  const { data: news } = await supabase
    .from("news_sport_meca")
    .select("id, sport_meca, synthese, date_creation, statut, message_erreur")
    .eq("id", id)
    .maybeSingle<NewsEnregistree>();

  if (!news) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/news" className="text-blue-600 underline">
        ← Retour à mes news
      </Link>
      <AffichageNews news={news} />
    </main>
  );
}