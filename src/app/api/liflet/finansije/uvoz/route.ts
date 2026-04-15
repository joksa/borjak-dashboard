import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Normalize string for comparison: uppercase, strip punctuation, collapse whitespace
function normalize(s: string): string {
  return (s || "")
    .toUpperCase()
    .replace(/[.,\-_\/\\()"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Tokens worth comparing (skip very common short words)
const SKIP = new Set(["DOO", "AD", "DD", "DOOOO", "D.O.O", "A.D", "CO", "LLC"]);
function tokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length > 1 && !SKIP.has(t));
}

// Jaccard-style overlap: |intersection| / |union|  (0..1)
function similarity(a: string, b: string): number {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / (ta.size + tb.size - shared);
}

export type ImportRow = {
  rowIndex: number;
  datum: string;    // dd.mm.yyyy
  valuta: string;   // dd.mm.yyyy
  klijentRaw: string;
  iznos: number;
};

export type MatchCandidate = {
  ID_Klijent: number;
  Naziv: string | null;
  Grad: string | null;
  PIB: string | null;
  score: number; // 0..1
};

export type MatchedRow = ImportRow & {
  candidates: MatchCandidate[];
};

export async function POST(request: NextRequest) {
  try {
    const rows: ImportRow[] = await request.json();

    // Collect unique raw names to minimize DB calls
    const uniqueNames = [...new Set(rows.map((r) => r.klijentRaw))];

    // For each unique name, find top candidates from DB
    const nameToMatches = new Map<string, MatchCandidate[]>();

    await Promise.all(
      uniqueNames.map(async (rawName) => {
        const toks = tokens(rawName);
        if (toks.length === 0) {
          nameToMatches.set(rawName, []);
          return;
        }

        // Build a broad OR query: any token must appear in Naziv
        // We use the 3 longest tokens to keep the query selective
        const keyTokens = [...toks].sort((a, b) => b.length - a.length).slice(0, 4);

        const candidates = await prisma.klijenti.findMany({
          where: {
            OR: keyTokens.map((t) => ({
              Naziv: { contains: t },
            })),
          },
          select: {
            ID_Klijent: true,
            Naziv: true,
            Grad: true,
            PIB: true,
          },
          take: 100,
        });

        // Score and sort
        const scored: MatchCandidate[] = candidates
          .map((c) => {
            let score = similarity(rawName, c.Naziv || "");
            // Boost if Grad appears anywhere in the raw name
            if (c.Grad && normalize(rawName).includes(normalize(c.Grad))) {
              score = Math.min(1, score + 0.15);
            }
            return { ...c, score };
          })
          .filter((c) => c.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        nameToMatches.set(rawName, scored);
      })
    );

    const result: MatchedRow[] = rows.map((row) => ({
      ...row,
      candidates: nameToMatches.get(row.klijentRaw) ?? [],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error matching uvoz rows:", error);
    return NextResponse.json({ error: "Failed to match rows" }, { status: 500 });
  }
}
