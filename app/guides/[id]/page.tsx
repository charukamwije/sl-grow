import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideView from "@/components/guides/GuideView";
import { summarizeGuides } from "@/lib/guides";
import { getGuide, getGuides } from "@/lib/guides-server";

type GuidePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const guide = await getGuide((await params).id);
  return guide ? { title: `${guide.name.en} grow guide` } : {};
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { id } = await params;
  const guides = await getGuides();
  const guide = guides.find((candidate) => candidate.id === id);

  if (!guide) {
    notFound();
  }

  return <GuideView guide={guide} guides={summarizeGuides(guides)} />;
}
