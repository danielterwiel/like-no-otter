/**
 * Strong Exercise Mapper
 *
 * Maps Strong exercise names to local exercise database entries using
 * fuzzy matching with Levenshtein distance.
 */

import { Platform } from "react-native";

const DATABASE_NAME = "likenootter.db";
const IS_WEB = Platform.OS === "web";

/** Default similarity threshold for fuzzy matching (0.8 = 80% similar) */
export const SIMILARITY_THRESHOLD = 0.8;

/** Number of suggestions to show for unmatched exercises */
const MAX_SUGGESTIONS = 5;

export interface ExerciseRecord {
  id: number;
  name: string;
}

export interface MappingMatch {
  exercise: ExerciseRecord;
  similarity: number;
  isExactMatch: boolean;
}

export interface MappedExercise {
  strongName: string;
  mappedExercise: ExerciseRecord | null;
  similarity: number;
  isExactMatch: boolean;
  fromCache: boolean;
}

export interface UnmappedExercise {
  strongName: string;
  suggestions: MappingMatch[];
}

export interface MappingResult {
  autoMapped: MappedExercise[];
  needsReview: UnmappedExercise[];
  skipped: string[];
}

export interface CachedMapping {
  exerciseId: number | null;
  isSkipped: boolean;
}

/**
 * Calculate Levenshtein distance between two strings (case-insensitive).
 * Measures the minimum number of single-character edits (insertions, deletions, substitutions)
 * required to change one string into the other.
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  const m = aLower.length;
  const n = bLower.length;

  // Handle empty strings
  if (m === 0) return n;
  if (n === 0) return m;

  // Create distance matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  // Initialize first row
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = aLower[i - 1] === bLower[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0.0 to 1.0).
 * 1.0 means identical, 0.0 means completely different.
 */
export function calculateSimilarity(a: string, b: string): number {
  // Both empty = identical
  if (a.length === 0 && b.length === 0) return 1;
  // One empty = no similarity
  if (a.length === 0 || b.length === 0) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);

  return 1 - distance / maxLength;
}

/**
 * Find the best matching exercise from a list using fuzzy matching.
 * Returns null if no match above the threshold is found.
 */
export function findBestMatch(
  strongName: string,
  exercises: ExerciseRecord[],
  threshold: number = SIMILARITY_THRESHOLD,
): MappingMatch | null {
  const strongNameLower = strongName.toLowerCase();
  let bestMatch: MappingMatch | null = null;

  for (const exercise of exercises) {
    const exerciseNameLower = exercise.name.toLowerCase();

    // Check for exact match first
    if (strongNameLower === exerciseNameLower) {
      return {
        exercise,
        similarity: 1,
        isExactMatch: true,
      };
    }

    // Calculate similarity
    const similarity = calculateSimilarity(strongName, exercise.name);

    if (similarity >= threshold) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = {
          exercise,
          similarity,
          isExactMatch: false,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Get top N suggestions for an unmatched exercise (sorted by similarity).
 */
function getTopSuggestions(
  strongName: string,
  exercises: ExerciseRecord[],
  maxCount: number = MAX_SUGGESTIONS,
): MappingMatch[] {
  const scored: MappingMatch[] = exercises.map((exercise) => ({
    exercise,
    similarity: calculateSimilarity(strongName, exercise.name),
    isExactMatch: false,
  }));

  // Sort by similarity descending and take top N
  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, maxCount);
}

/**
 * Get cached mapping from database.
 */
export async function getCachedMapping(strongName: string): Promise<CachedMapping | null> {
  if (IS_WEB) return null;

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const row = db.getFirstSync<{
      strong_name: string;
      exercise_id: number | null;
      is_skipped: number;
    }>(
      `SELECT strong_name, exercise_id, is_skipped FROM strong_exercise_mappings WHERE strong_name = ?`,
      strongName,
    );

    if (!row) return null;

    return {
      exerciseId: row.exercise_id,
      isSkipped: row.is_skipped === 1,
    };
  } catch (error) {
    console.error("Failed to get cached mapping:", error);
    return null;
  }
}

/**
 * Save exercise mapping to database cache.
 */
export async function saveExerciseMapping(
  strongName: string,
  exerciseId: number | null,
  isSkipped: boolean = false,
): Promise<void> {
  if (IS_WEB) return;

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const now = Math.floor(Date.now() / 1000);

    db.runSync(
      `INSERT OR REPLACE INTO strong_exercise_mappings (strong_name, exercise_id, is_skipped, created_at)
       VALUES (?, ?, ?, ?)`,
      [strongName, exerciseId, isSkipped ? 1 : 0, now],
    );
  } catch (error) {
    console.error("Failed to save exercise mapping:", error);
  }
}

/**
 * Get all exercises from database.
 */
async function getAllExercises(): Promise<ExerciseRecord[]> {
  if (IS_WEB) return [];

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    return db.getAllSync<ExerciseRecord>(`SELECT id, name FROM exercises ORDER BY name`);
  } catch (error) {
    console.error("Failed to get exercises:", error);
    return [];
  }
}

/**
 * Get exercise by ID from database.
 */
async function getExerciseById(exerciseId: number): Promise<ExerciseRecord | null> {
  if (IS_WEB) return null;

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    return db.getFirstSync<ExerciseRecord>(
      `SELECT id, name FROM exercises WHERE id = ?`,
      exerciseId,
    );
  } catch (error) {
    console.error("Failed to get exercise by ID:", error);
    return null;
  }
}

/**
 * Map Strong exercise names to local exercise database entries.
 * Uses fuzzy matching with Levenshtein distance for automatic mapping,
 * and caches mappings for future imports.
 */
export async function mapStrongExercises(strongExerciseNames: string[]): Promise<MappingResult> {
  const autoMapped: MappedExercise[] = [];
  const needsReview: UnmappedExercise[] = [];
  const skipped: string[] = [];

  // Get all exercises from database for matching
  const exercises = await getAllExercises();

  // Deduplicate exercise names
  const uniqueNames = [...new Set(strongExerciseNames)];

  for (const strongName of uniqueNames) {
    // Check cache first
    const cached = await getCachedMapping(strongName);

    if (cached) {
      if (cached.isSkipped) {
        skipped.push(strongName);
        continue;
      }

      if (cached.exerciseId !== null) {
        const exercise = await getExerciseById(cached.exerciseId);
        if (exercise) {
          autoMapped.push({
            strongName,
            mappedExercise: exercise,
            similarity: 1,
            isExactMatch: true,
            fromCache: true,
          });
          continue;
        }
      }
    }

    // Try to find a match
    const match = findBestMatch(strongName, exercises);

    if (match) {
      autoMapped.push({
        strongName,
        mappedExercise: match.exercise,
        similarity: match.similarity,
        isExactMatch: match.isExactMatch,
        fromCache: false,
      });
    } else {
      // No automatic match - needs manual review
      const suggestions = getTopSuggestions(strongName, exercises);
      needsReview.push({
        strongName,
        suggestions,
      });
    }
  }

  return {
    autoMapped,
    needsReview,
    skipped,
  };
}

/**
 * Save all mappings from the mapping result to database cache.
 */
export async function saveMappingResults(
  mappings: Map<string, { exerciseId: number | null; isSkipped: boolean }>,
): Promise<void> {
  for (const [strongName, mapping] of mappings) {
    await saveExerciseMapping(strongName, mapping.exerciseId, mapping.isSkipped);
  }
}
