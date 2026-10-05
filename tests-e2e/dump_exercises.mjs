// Prints the exercises the app will build, so the browser test knows the answers.
import * as c from "../frontend/src/data/curriculum.js";
import { buildLesson, buildTest } from "../frontend/src/lib/exercises.js";
const [, , moduleId, which, mode] = process.argv;
const mod = c.getModule(moduleId);
const list = which === "test" ? buildTest(mod, mode) : buildLesson(mod, Number(which), mode);
console.log(
  JSON.stringify(
    list.map((e) => ({
      kind: e.kind,
      show: e.show,
      np: e.target?.np ?? "",
      en: e.target?.en ?? "",
      options: (e.options ?? []).map((o) => ({ np: o.np, en: o.en })),
      // word order and letter scramble: the tiles in their correct order
      order: e.tiles ? [...e.tiles].sort((a, b) => a.id - b.id).map((t) => t.np) : null,
      // pair-up: which word goes with which meaning
      pairs: e.pairs ? e.pairs.map((p) => ({ np: p.np, en: p.en })) : null,
    })),
  ),
);
