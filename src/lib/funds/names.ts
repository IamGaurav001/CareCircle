// Compares the hospital printed on a bill with the hospital the family named as payee.
// Names are written many ways, so this only says whether they look like the same place;
// a mismatch is a warning for the reviewer, never a decision.

const CONNECTORS = new Set(["of", "the", "and", "for"]);

// Words that say what kind of place it is, not which one.
const GENERIC = new Set([
  ...CONNECTORS,
  "hospital", "hospitals", "clinic", "clinics", "medical", "medicare", "centre", "center", "health", "healthcare",
  "care", "multispeciality", "multispecialty", "speciality", "specialty", "super", "institute", "sciences", "research",
  "nursing", "home", "pvt", "private", "ltd", "limited", "llp", "inc", "trust", "foundation", "and", "co",
]);

function words(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** True when two hospital names share a distinctive word, or one is the other's initials (AIIMS). */
export function looksLikeSameProvider(a: string, b: string): boolean {
  const wordsA = words(a);
  const wordsB = words(b);
  const distinctive = (list: string[]) => new Set(list.filter((word) => word.length >= 3 && !GENERIC.has(word)));
  const keyA = distinctive(wordsA);
  const keyB = distinctive(wordsB);
  if ([...keyA].some((word) => keyB.has(word))) return true;

  const initials = (list: string[]) => list.filter((word) => !CONNECTORS.has(word)).map((word) => word[0]).join("");
  const initialsA = initials(wordsA);
  const initialsB = initials(wordsB);
  return (initialsA.length >= 3 && wordsB.includes(initialsA)) || (initialsB.length >= 3 && wordsA.includes(initialsB));
}
