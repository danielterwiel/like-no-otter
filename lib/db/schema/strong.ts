/**
 * Strong Exercise Mapping Schema
 *
 * Stores cached mappings between Strong exercise names and local exercise IDs.
 * Used to avoid re-mapping exercises on subsequent imports.
 */

export interface StrongExerciseMapping {
  id: number;
  strongName: string; // Original exercise name from Strong CSV
  exerciseId: number | null; // Mapped local exercise ID (null if skipped)
  isSkipped: boolean; // True if user chose to skip this exercise
  createdAt: Date;
}

export interface NewStrongExerciseMapping {
  strongName: string;
  exerciseId: number | null;
  isSkipped: boolean;
}
