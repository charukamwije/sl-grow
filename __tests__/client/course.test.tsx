/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CoursePlayer from "@/components/join/CoursePlayer";
import { LanguageProvider } from "@/contexts/language-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { getTrack, type CourseModule } from "@/lib/data/certifications";
import { DEVICE_LEARNING_KEY } from "@/lib/device-history";
import "./setup";

// Node 26's own experimental localStorage shadows jsdom's; use a plain one
class MemoryStorage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  clear() {
    this.items.clear();
  }
}

vi.stubGlobal("localStorage", new MemoryStorage());

const seeds = getTrack("seeds")!;

function renderCourse(initialModule = 0) {
  return render(
    <NotificationProvider>
      <LanguageProvider>
        <CoursePlayer track={seeds} initialModule={initialModule} />
      </LanguageProvider>
    </NotificationProvider>
  );
}


async function nextLesson() {
  await userEvent.click(screen.getByRole("button", { name: /^next$/i }));
}

async function answerAll(mod: CourseModule, correct = true) {
  for (const q of mod.quiz) {
    const pick = correct ? q.answer : (q.answer + 1) % q.options.length;
    await userEvent.click(screen.getByRole("radio", { name: q.options[pick].en }));
  }
  await userEvent.click(screen.getByRole("button", { name: "Check my answers" }));
}

function passed(): { module: string }[] {
  return JSON.parse(localStorage.getItem(DEVICE_LEARNING_KEY) ?? "[]");
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
});

describe("a certification course", () => {
  it("shows one lesson at a time with its points and a task to try", async () => {
    renderCourse();

    const first = seeds.modules[0].lessons[0];
    expect(screen.getByText("Lesson 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: first.title.en })).toBeInTheDocument();
    for (const point of first.points) {
      expect(screen.getByText(point.en)).toBeInTheDocument();
    }
    expect(screen.getByText("Try it")).toBeInTheDocument();
    expect(screen.getByText(first.task.en)).toBeInTheDocument();

    await nextLesson();
    expect(screen.getByText("Lesson 2 of 3")).toBeInTheDocument();
  });

  it("ends each module with a quiz that must be passed", async () => {
    renderCourse();
    const first = seeds.modules[0];

    await nextLesson();
    await nextLesson();
    await userEvent.click(screen.getByRole("button", { name: "Take the quiz" }));
    expect(screen.getByRole("heading", { name: /Check what you learned/ })).toBeInTheDocument();

    // A wrong answer: told the score, nothing saved
    await answerAll(first, false);
    expect(screen.getByRole("alert")).toHaveTextContent("0 of 2 correct");
    expect(passed()).toHaveLength(0);

    // All right: the module is complete and saved on the device
    await answerAll(first);
    expect(screen.getByRole("heading", { name: "Module complete!" })).toBeInTheDocument();
    expect(passed()[0]).toMatchObject({ module: first.id });

    await userEvent.click(screen.getByRole("button", { name: "Next module" }));
    expect(screen.getByText(/Module 2 · Clean, dry and store/)).toBeInTheDocument();
  });

  it("starts at the module it is asked to resume", () => {
    renderCourse(2);

    expect(screen.getByText(/Module 3 · Test and label/)).toBeInTheDocument();
  });

  it("lets the learner jump to any lesson or quiz from the outline", async () => {
    renderCourse();

    const outline = screen.getByRole("navigation", { name: "Course outline" });
    const lesson = seeds.modules[1].lessons[2];
    await userEvent.click(screen.getByRole("button", { name: new RegExp(lesson.title.en) }));
    expect(screen.getByRole("heading", { level: 2, name: lesson.title.en })).toBeInTheDocument();
    expect(outline).toBeInTheDocument();
  });

  it("celebrates the end and links to the application once every module is done", async () => {
    // The first two modules already passed on this device
    localStorage.setItem(
      DEVICE_LEARNING_KEY,
      JSON.stringify(
        seeds.modules.slice(0, 2).map((m) => ({ track: "seeds", module: m.id, passedAt: "2026-11-03T08:00:00.000Z" }))
      )
    );
    renderCourse(2);
    const last = seeds.modules[2];

    await userEvent.click(screen.getAllByRole("button", { name: /^Quiz$/ })[2]);
    await answerAll(last);
    await userEvent.click(screen.getByRole("button", { name: "Course complete!" }));

    expect(screen.getByRole("heading", { name: /Course complete!/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /apply for your badge/i })).toHaveAttribute(
      "href",
      "/join?path=seeds"
    );
    expect(screen.getByText("100% done")).toBeInTheDocument();
  });

  it("sends the learner back to a skipped module instead of finishing", async () => {
    renderCourse(2);
    const last = seeds.modules[2];

    await userEvent.click(screen.getAllByRole("button", { name: /^Quiz$/ })[2]);
    await answerAll(last);
    await userEvent.click(screen.getByRole("button", { name: "Next module" }));

    expect(screen.getByText(/Module 1 · Choose good parent plants/)).toBeInTheDocument();
    expect(screen.queryByText(/Course complete!/)).not.toBeInTheDocument();
  });
});

