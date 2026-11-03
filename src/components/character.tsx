import { createAvatar, type StyleOptions } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";

// Hand-drawn faces (DiceBear's Notionists style, CC0) give every person on the site a face of their own.
// A face comes from the name, so the same person looks the same on every page.

export type Look = StyleOptions<notionists.Options>;

// Hair styles that read as everyday people; the spiky, hat and costume ones are left out.
const HAIR = [1, 2, 5, 6, 7, 10, 12, 13, 15, 16, 21, 23, 24, 28, 31, 36, 37, 39, 41, 47, 48, 49, 53, 55, 58].map(
  (n) => `variant${String(n).padStart(2, "0")}`,
) as Look["hair"];

// Clear glasses only: the dark ones read as sunglasses.
const GLASSES = ["variant03", "variant08"] as Look["glasses"];

const BACKGROUNDS = ["fde2d6", "dbe8fb", "d9f2e3", "fdf0c8", "ebe3fb"];

const cache = new Map<string, string>();

function faceUri(seed: string, look: Look = {}): string {
  const key = `${seed}|${JSON.stringify(look)}`;
  let uri = cache.get(key);
  if (!uri) {
    uri = createAvatar(notionists, {
      seed,
      hair: HAIR,
      bodyIconProbability: 0,
      gestureProbability: 0,
      beardProbability: 15,
      glasses: GLASSES,
      glassesProbability: 15,
      backgroundColor: BACKGROUNDS,
      ...look,
    }).toDataUri();
    cache.set(key, uri);
  }
  return uri;
}

/** A person's hand-drawn face in a circle. No name means an anonymous supporter, shown as a heart. */
export function Avatar({ name, look, className = "h-10 w-10" }: { name: string | null | undefined; look?: Look; className?: string }) {
  const seed = name?.trim();
  if (!seed) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent ring-4 ring-background ${className}`} aria-hidden>
        {/* The heart from ui.tsx, drawn here so ui.tsx can import this file. */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-1/2 w-1/2" aria-hidden>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
      </span>
    );
  }
  // A data URI, so faces need no network request and work in every theme.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={faceUri(seed, look)} alt="" className={`shrink-0 rounded-full ring-4 ring-background ${className}`} />;
}

/** A person drawn from the chest up on a clear background, for the pictures on the home page. */
export function Figure({ name, look, className = "h-28 w-28" }: { name: string; look?: Look; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={faceUri(name, { backgroundColor: ["transparent"], ...look })} alt="" className={`shrink-0 ${className}`} />;
}
