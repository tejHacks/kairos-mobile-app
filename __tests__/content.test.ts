import { dailyPsalms } from "../constants/daily-psalms";
import { dailyVerses } from "../constants/daily-verses";
import { themes } from "../constants/themes";
import { REMINDER_VERSES } from "../hooks/usePrayerTimes";

const all = [
  ...dailyVerses,
  ...dailyPsalms,
  ...Object.values(themes).flatMap((t) => t.verses),
];

// Wording that only appears in modern translations, never in the KJV.
const MODERN = [/declares the Lord/i, /do not be anxious/i, /I lack nothing/i, /ever-present help/i, /\bstronghold of my life\b/i, /—/];

it("every verse has text and a reference", () => {
  expect(all.length).toBeGreaterThan(300);
  for (const v of all) {
    expect(v.text.trim().length).toBeGreaterThan(10);
    expect(v.ref).toMatch(/^(?:[1-3] )?[A-Z][A-Za-z ]+ \d+:\d+(?:[-,]\d+)*$/);
  }
});

it("all scripture is King James Version wording", () => {
  for (const v of all) {
    for (const pattern of MODERN) expect(v.text).not.toMatch(pattern);
  }
  const psalm23 = dailyPsalms.find((p) => p.ref.startsWith("Psalm 23:1"));
  expect(psalm23?.text).toMatch(/^The LORD is my shepherd; I shall not want\./);
});

it("no psalm headings or editor markers leak into the text", () => {
  for (const v of all) expect(v.text).not.toMatch(/\[\[|➔|\[fn\]/);
});

it("every reminder verse names its reference", () => {
  for (const v of REMINDER_VERSES) expect(v).toMatch(/\([1-3]? ?[A-Z][a-z]+ \d+:\d+\)$/);
});
