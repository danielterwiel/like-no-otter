import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-native Platform
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

// Mock expo-sqlite
const mockGetFirstSync = vi.fn();
const mockGetAllSync = vi.fn();
const mockRunSync = vi.fn();
const mockOpenDatabaseSync = vi.fn(() => ({
  getFirstSync: mockGetFirstSync,
  getAllSync: mockGetAllSync,
  runSync: mockRunSync,
}));

vi.mock("expo-sqlite", () => ({
  openDatabaseSync: () => mockOpenDatabaseSync(),
}));

describe("levenshteinDistance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 for identical strings", async () => {
    const { levenshteinDistance } = await import("./mapper");
    expect(levenshteinDistance("bench press", "bench press")).toBe(0);
  });

  it("should return length of other string when one is empty", async () => {
    const { levenshteinDistance } = await import("./mapper");
    expect(levenshteinDistance("", "hello")).toBe(5);
    expect(levenshteinDistance("hello", "")).toBe(5);
  });

  it("should calculate correct distance for simple substitutions", async () => {
    const { levenshteinDistance } = await import("./mapper");
    // "kitten" -> "sitten" (substitution k->s) -> "sittin" (substitution e->i) -> "sitting" (insertion g)
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });

  it("should calculate correct distance for insertions and deletions", async () => {
    const { levenshteinDistance } = await import("./mapper");
    expect(levenshteinDistance("abc", "ab")).toBe(1); // deletion
    expect(levenshteinDistance("ab", "abc")).toBe(1); // insertion
  });

  it("should be case insensitive when comparing", async () => {
    const { levenshteinDistance } = await import("./mapper");
    expect(levenshteinDistance("Bench Press", "bench press")).toBe(0);
    expect(levenshteinDistance("SQUAT", "squat")).toBe(0);
  });
});

describe("calculateSimilarity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 1.0 for identical strings", async () => {
    const { calculateSimilarity } = await import("./mapper");
    expect(calculateSimilarity("bench press", "bench press")).toBe(1);
  });

  it("should return 0.0 for completely different strings of same length", async () => {
    const { calculateSimilarity } = await import("./mapper");
    // "abc" vs "xyz" - distance is 3, max length is 3, similarity = 1 - 3/3 = 0
    expect(calculateSimilarity("abc", "xyz")).toBe(0);
  });

  it("should return value between 0 and 1 for partial matches", async () => {
    const { calculateSimilarity } = await import("./mapper");
    const similarity = calculateSimilarity("bench press", "dumbbell bench press");
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
  });

  it("should handle empty strings", async () => {
    const { calculateSimilarity } = await import("./mapper");
    expect(calculateSimilarity("", "")).toBe(1); // Both empty = identical
    expect(calculateSimilarity("hello", "")).toBe(0); // One empty = no similarity
  });
});

describe("findBestMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return exact match when found", async () => {
    const { findBestMatch } = await import("./mapper");
    const exercises = [
      { id: 1, name: "Barbell Bench Press" },
      { id: 2, name: "Dumbbell Curl" },
      { id: 3, name: "Squat" },
    ];

    const result = findBestMatch("Barbell Bench Press", exercises);

    expect(result).not.toBeNull();
    expect(result?.exercise.name).toBe("Barbell Bench Press");
    expect(result?.similarity).toBe(1);
    expect(result?.isExactMatch).toBe(true);
  });

  it("should return fuzzy match above threshold", async () => {
    const { findBestMatch } = await import("./mapper");
    const exercises = [
      { id: 1, name: "Barbell Bench Press" },
      { id: 2, name: "Dumbbell Curl" },
    ];

    // "Barbell Bench Pres" (typo) should fuzzy match to "Barbell Bench Press"
    const result = findBestMatch("Barbell Bench Pres", exercises, 0.8);

    expect(result).not.toBeNull();
    expect(result?.exercise.name).toBe("Barbell Bench Press");
    expect(result?.isExactMatch).toBe(false);
    expect(result?.similarity).toBeGreaterThanOrEqual(0.8);
  });

  it("should return null when no match above threshold", async () => {
    const { findBestMatch } = await import("./mapper");
    const exercises = [
      { id: 1, name: "Barbell Squat" },
      { id: 2, name: "Deadlift" },
    ];

    // "Wrist Curl" is very different from squat/deadlift
    const result = findBestMatch("Wrist Curl", exercises, 0.8);

    expect(result).toBeNull();
  });

  it("should use default threshold of 0.8", async () => {
    const { SIMILARITY_THRESHOLD } = await import("./mapper");
    expect(SIMILARITY_THRESHOLD).toBe(0.8);
  });
});

describe("mapStrongExercises", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export mapStrongExercises function", async () => {
    const { mapStrongExercises } = await import("./mapper");
    expect(typeof mapStrongExercises).toBe("function");
  });

  it("should return auto-mapped exercises for exact matches", async () => {
    // Mock database to return exercise data
    mockGetAllSync.mockReturnValue([
      { id: 1, name: "Barbell Bench Press" },
      { id: 2, name: "Dumbbell Curl" },
    ]);
    mockGetFirstSync.mockReturnValue(null); // No cached mappings

    const { mapStrongExercises } = await import("./mapper");
    const strongExercises = ["Barbell Bench Press", "Dumbbell Curl"];

    const result = await mapStrongExercises(strongExercises);

    expect(result.autoMapped.length).toBe(2);
    expect(result.needsReview.length).toBe(0);
    expect(result.autoMapped[0].strongName).toBe("Barbell Bench Press");
    expect(result.autoMapped[0].mappedExercise?.name).toBe("Barbell Bench Press");
  });

  it("should return exercises needing review when no match found", async () => {
    mockGetAllSync.mockReturnValue([{ id: 1, name: "Barbell Bench Press" }]);
    mockGetFirstSync.mockReturnValue(null);

    const { mapStrongExercises } = await import("./mapper");
    const strongExercises = ["Wrist Curl Machine"];

    const result = await mapStrongExercises(strongExercises);

    expect(result.autoMapped.length).toBe(0);
    expect(result.needsReview.length).toBe(1);
    expect(result.needsReview[0].strongName).toBe("Wrist Curl Machine");
    expect(result.needsReview[0].suggestions.length).toBeGreaterThanOrEqual(0);
  });

  it("should use cached mappings when available", async () => {
    // Return cached mapping and exercise data
    mockGetFirstSync.mockImplementation((query: string) => {
      if (query.includes("strong_exercise_mappings")) {
        return { strong_name: "Bench Press (Barbell)", exercise_id: 1, is_skipped: 0 };
      }
      if (query.includes("exercises WHERE id")) {
        return { id: 1, name: "Barbell Bench Press" };
      }
      return null;
    });
    mockGetAllSync.mockReturnValue([{ id: 1, name: "Barbell Bench Press" }]);

    const { mapStrongExercises } = await import("./mapper");
    const strongExercises = ["Bench Press (Barbell)"];

    const result = await mapStrongExercises(strongExercises);

    expect(result.autoMapped.length).toBe(1);
    expect(result.autoMapped[0].fromCache).toBe(true);
  });

  it("should handle skipped exercises from cache", async () => {
    mockGetAllSync.mockReturnValue([]);
    mockGetFirstSync.mockImplementation((query: string) => {
      if (query.includes("strong_exercise_mappings")) {
        return { strong_name: "Skip This", exercise_id: null, is_skipped: 1 };
      }
      return null;
    });

    const { mapStrongExercises } = await import("./mapper");
    const strongExercises = ["Skip This"];

    const result = await mapStrongExercises(strongExercises);

    expect(result.skipped.length).toBe(1);
    expect(result.skipped[0]).toBe("Skip This");
  });
});

describe("saveExerciseMapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should save mapping to database", async () => {
    const { saveExerciseMapping } = await import("./mapper");

    await saveExerciseMapping("Bench Press (Barbell)", 1);

    expect(mockRunSync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT OR REPLACE INTO strong_exercise_mappings"),
      expect.arrayContaining(["Bench Press (Barbell)", 1, 0]),
    );
  });

  it("should save skipped exercise to database", async () => {
    const { saveExerciseMapping } = await import("./mapper");

    await saveExerciseMapping("Skip This", null, true);

    expect(mockRunSync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT OR REPLACE INTO strong_exercise_mappings"),
      expect.arrayContaining(["Skip This", null, 1]),
    );
  });
});

describe("getCachedMapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cached mapping if exists", async () => {
    mockGetFirstSync.mockReturnValue({
      strong_name: "Test Exercise",
      exercise_id: 5,
      is_skipped: 0,
    });

    const { getCachedMapping } = await import("./mapper");
    const result = await getCachedMapping("Test Exercise");

    expect(result).not.toBeNull();
    expect(result?.exerciseId).toBe(5);
    expect(result?.isSkipped).toBe(false);
  });

  it("should return null if no cached mapping", async () => {
    mockGetFirstSync.mockReturnValue(null);

    const { getCachedMapping } = await import("./mapper");
    const result = await getCachedMapping("Unknown Exercise");

    expect(result).toBeNull();
  });
});
