import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CoursePlayer from "@/components/join/CoursePlayer";
import { getTrack } from "@/lib/data/certifications";

type CoursePageProps = {
  params: Promise<{ track: string }>;
  searchParams: Promise<{ module?: string }>;
};

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const track = getTrack((await params).track);
  return track ? { title: `${track.name.en} course` } : {};
}

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
  const track = getTrack((await params).track);
  if (!track) notFound();

  // ?module=2 resumes at a module (1-based); anything else starts at the top
  const requested = Number((await searchParams).module);
  const initialModule =
    Number.isInteger(requested) && requested >= 1 && requested <= track.modules.length
      ? requested - 1
      : 0;

  return <CoursePlayer key={track.id} track={track} initialModule={initialModule} />;
}
