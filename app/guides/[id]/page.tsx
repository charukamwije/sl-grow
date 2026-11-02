import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideView from "@/components/guides/GuideView";
import { getGuide } from "@/lib/data/guides";

type GuidePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const guide = getGuide((await params).id);
  return guide ? { title: `${guide.name.en} grow guide` } : {};
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { id } = await params;

  if (!getGuide(id)) {
    notFound();
  }

  return <GuideView id={id} />;
}
