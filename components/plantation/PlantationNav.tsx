import Link from "next/link";
import { chip } from "../ui/styles";

const SECTIONS = [
  { href: "/plantation", label: "📈 Investment calculator", id: "calculator" },
  { href: "/plantation/manage", label: "🌿 My plantations", id: "manage" },
] as const;

/** Switches between the calculator for newcomers and the records for planters */
export default function PlantationNav({ current }: { current: "calculator" | "manage" }) {
  return (
    <nav aria-label="Plantation" className="flex flex-wrap gap-2">
      {SECTIONS.map((section) => (
        <Link
          key={section.id}
          href={section.href}
          aria-current={current === section.id ? "page" : undefined}
          className={chip(current === section.id)}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
