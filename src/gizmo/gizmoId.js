/**
 * gizmoId.js – lineage-aware ID generation for Gizmos.
 *
 * Format:  SEG1-SEG2-SEG3
 *   SEG1  3 hex chars  —  first char = generation depth (0-F), next 2 = unique random per gizmo
 *   SEG2  4 hex chars  —  surname inherited from parent's SEG2 (clone) or parent1's SEG3 (crossover)
 *   SEG3  4 hex chars  —  surname inherited from parent's SEG3 (clone) or parent2's SEG3 (crossover)
 *
 * SEG1 tail is ALWAYS freshly random so no two gizmos ever share the same full ID,
 * even when born from the same parent in the same generation.
 *
 * Examples:
 *   Initial gizmo:               0A3-B2D1-C9E4       (all random, gen=0)
 *   Clone of 0A3-B2D1-C9E4:      1F7-B2D1-C9E4       (gen=1, new random tail, surnames inherited)
 *   Clone again:                  2Q9-B2D1-C9E4       (gen=2, new random tail, surnames inherited)
 *   Crossover of
 *     parent1 1XY-CCCC-EEEE  and
 *     parent2 1XY-DDDD-GGGG: →  2R4-EEEE-GGGG       (gen=max+1, new tail, seg2=p1.seg3, seg3=p2.seg3)
 */

const HEX_CHARS = "0123456789ABCDEF";

function randHex(len) {
  let s = "";
  for (let i = 0; i < len; i++) s += HEX_CHARS[Math.floor(Math.random() * 16)];
  return s;
}

/** True if a hex segment is trivially repetitive (e.g. "0000", "FFFF", "AAAA"). */
function isBoring(seg) {
  return /^(.)\1+$/.test(seg);
}

/** Generate a 4-char hex segment that is not boring and not in the used set. */
function uniqueSeg4(usedSet) {
  let s;
  let attempts = 0;
  do {
    s = randHex(4);
    attempts++;
  } while ((isBoring(s) || usedSet.has(s)) && attempts < 200);
  usedSet.add(s);
  return s;
}

// Registry of SEG2 and SEG3 values issued to the initial generation.
// Cleared on simulation reset so a new run gets fresh families.
const _usedSeg2 = new Set();
const _usedSeg3 = new Set();

/** Reset the uniqueness registry (call when starting a new simulation). */
export function resetIdRegistry() {
  _usedSeg2.clear();
  _usedSeg3.clear();
}

/** Parse an ID string into its three segments. */
function parse(id) {
  if (typeof id !== "string") return null;
  const parts = id.split("-");
  if (parts.length !== 3) return null;
  return { seg1: parts[0], seg2: parts[1], seg3: parts[2] };
}

/** Extract the generation counter (first char of SEG1 as hex integer). */
function getGen(id) {
  const p = parse(id);
  if (!p) return 0;
  return parseInt(p.seg1[0], 16) || 0;
}

/** Increment generation counter, clamped to F (15). */
function nextGen(id) {
  return Math.min(getGen(id) + 1, 15);
}

/**
 * Generate a fully random ID for an initial (non-lineage) gizmo.
 * SEG1 starts with '0' (generation 0) + 2 random hex chars.
 * SEG2 and SEG3 are guaranteed unique within the current simulation run
 * and are never trivially repetitive patterns (e.g. "0000", "FFFF").
 */
export function generateInitialId() {
  const seg1 = `0${randHex(2)}`;
  const seg2 = uniqueSeg4(_usedSeg2);
  const seg3 = uniqueSeg4(_usedSeg3);
  return `${seg1}-${seg2}-${seg3}`;
}

/**
 * Generate a clone-child ID.
 * SEG1: gen+1 + 2 NEW random hex chars (unique per child, never same as parent's SEG1 tail)
 * SEG2: parent.seg2  (inherited surname)
 * SEG3: parent.seg3  (inherited surname)
 *
 * @param {string} parentId
 * @returns {string}
 */
export function generateCloneId(parentId) {
  const p = parse(parentId);
  if (!p) return generateInitialId();
  const gen = nextGen(parentId).toString(16).toUpperCase();
  const seg1 = `${gen}${randHex(2)}`;
  return `${seg1}-${p.seg2}-${p.seg3}`;
}

/**
 * Generate a crossover-child ID.
 * SEG1: max(p1gen, p2gen)+1 + 2 NEW random hex chars
 * SEG2: p1.seg3  (parent1's surname becomes child's first surname)
 * SEG3: p2.seg3  (parent2's surname becomes child's second surname)
 *
 * @param {string} parent1Id
 * @param {string} parent2Id
 * @returns {string}
 */
export function generateCrossoverId(parent1Id, parent2Id) {
  const p1 = parse(parent1Id);
  const p2 = parse(parent2Id);
  if (!p1 || !p2) return generateInitialId();
  const gen = Math.max(getGen(parent1Id), getGen(parent2Id)) + 1;
  const genHex = Math.min(gen, 15).toString(16).toUpperCase();
  const seg1 = `${genHex}${randHex(2)}`;
  return `${seg1}-${p1.seg3}-${p2.seg3}`;
}
