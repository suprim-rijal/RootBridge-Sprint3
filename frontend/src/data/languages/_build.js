const LANGUAGE_PHASES = ["Encounter", "Notice", "Retrieve", "Use"];
const CULTURE_PHASES = ["Encounter", "Notice", "Compare", "Create"];

const defaultLessonTitles = (kind, title) =>
  kind === "culture"
    ? [
        `Discover: ${title}`,
        "Look closer",
        "Compare with home",
        "Make it your own",
      ]
    : [
        `Hear it: ${title}`,
        "Notice the pattern",
        "Remember and say it",
        "Use it in a short exchange",
      ];

// One module. `kind` is "language" or "culture".
export function mod(prefix, kind, spec) {
  const id = `${prefix}-${spec.code.toLowerCase().replace(".", "-")}`;
  const titles = spec.lessons ?? defaultLessonTitles(kind, spec.title);
  const phases = kind === "culture" ? CULTURE_PHASES : LANGUAGE_PHASES;
  return {
    id,
    code: spec.code,
    title: spec.title,
    goal: spec.goal,
    lessons: titles.map((title, i) => ({
      id: `${id}-l${i + 1}`,
      title,
      phase: phases[i] ?? "Use",
      minutes: 7,
    })),
    items: spec.items.map(([np, rom, en, note]) => ({
      np,
      rom,
      en,
      ...(note ? { note } : {}),
    })),
    skills:
      spec.skills ??
      (kind === "culture"
        ? ["culture", "listening"]
        : ["listening", "speaking", "reading"]),
    mechanics: spec.mechanics ?? [
      "hear-find",
      "typing",
      "echo",
      "match",
      "meaning",
    ],
    xp: spec.xp ?? 100,
    testTasks: spec.testTasks ?? [`Show what you learned in “${spec.title}”`],
    note: spec.note ?? "",
  };
}

// One chapter of modules.
export function chapter(prefix, kind, spec) {
  return {
    id: `${prefix}-${spec.code.toLowerCase()}`,
    code: spec.code,
    track: kind,
    title: spec.title,
    nepaliTitle: spec.nativeTitle ?? "", // field name kept from Sprint 2
    summary: spec.summary ?? "",
    modules: spec.modules.map((m) => mod(prefix, kind, m)),
  };
}
