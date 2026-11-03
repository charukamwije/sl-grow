import type { Metadata } from "next";
import JoinPage from "@/components/join/JoinPage";

export const metadata: Metadata = {
  title: "Join",
  description:
    "Learn, apply what you learn, and earn an Aswedduma Certified digital badge for your home garden, your seeds or your plantation.",
};

export default function Join() {
  return <JoinPage />;
}
