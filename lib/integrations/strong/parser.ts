/**
 * Strong CSV Parser
 *
 * Parses CSV exports from the Strong workout app.
 * Strong CSV columns: Date, Workout Name, Duration, Exercise Name, Set Order,
 * Weight, Reps, Distance, Seconds, Notes, Workout Notes
 */

export interface StrongCSVRow {
  date: string; // "2024-01-15 09:30:00"
  workoutName: string;
  duration: string; // "0h 45m" or "1h 30m 15s"
  exerciseName: string;
  setOrder: number;
  weight: number | null;
  reps: number | null;
  distance: number | null;
  seconds: number | null;
  notes: string | null;
  workoutNotes: string | null;
}

export interface ParsedStrongSet {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  isWarmup: boolean;
}

export interface ParsedStrongExercise {
  name: string;
  sets: ParsedStrongSet[];
}

export interface ParsedStrongWorkout {
  id: string; // Unique identifier for deselection
  date: Date;
  name: string;
  durationSeconds: number;
  exercises: ParsedStrongExercise[];
  notes: string | null;
  selected: boolean; // For preview screen selection
}

export interface StrongParseResult {
  success: boolean;
  workouts: ParsedStrongWorkout[];
  totalWorkouts: number;
  totalExercises: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  error?: string;
}

/**
 * Parse duration string from Strong CSV format to seconds
 * Examples: "0h 45m", "1h 30m 15s", "45m", "1h"
 */
export function parseDuration(duration: string): number {
  if (!duration) return 0;

  let totalSeconds = 0;

  // Match hours
  const hoursMatch = duration.match(/(\d+)h/);
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
  }

  // Match minutes
  const minutesMatch = duration.match(/(\d+)m(?!s)/); // m but not ms
  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1], 10) * 60;
  }

  // Match seconds
  const secondsMatch = duration.match(/(\d+)s/);
  if (secondsMatch) {
    totalSeconds += parseInt(secondsMatch[1], 10);
  }

  return totalSeconds;
}

/**
 * Parse date string from Strong CSV format to Date object
 * Format: "2024-01-15 09:30:00"
 */
export function parseStrongDate(dateStr: string): Date {
  // Strong dates are in "YYYY-MM-DD HH:MM:SS" format
  const [datePart, timePart] = dateStr.split(" ");
  if (!datePart) {
    return new Date();
  }

  const [year, month, day] = datePart.split("-").map((n) => parseInt(n, 10));
  const [hours, minutes, seconds] = timePart
    ? timePart.split(":").map((n) => parseInt(n, 10))
    : [0, 0, 0];

  return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * Generate a unique workout ID from date and name
 */
export function generateWorkoutId(date: Date, name: string): string {
  const dateStr = date.toISOString().split("T")[0];
  const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `${dateStr}-${nameSlug}`;
}

/**
 * Parse a single CSV line respecting quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Push the last field
  result.push(current.trim());

  return result;
}

/**
 * Parse Strong CSV content into structured workout data
 */
export function parseStrongCSV(csvContent: string): StrongParseResult {
  try {
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      return {
        success: false,
        workouts: [],
        totalWorkouts: 0,
        totalExercises: 0,
        dateRange: { start: null, end: null },
        error: "CSV file is empty or has no data rows",
      };
    }

    // Parse header to get column indices
    const header = parseCSVLine(lines[0]);
    const columnIndices: Record<string, number> = {};

    for (let i = 0; i < header.length; i++) {
      const colName = header[i].trim();
      columnIndices[colName] = i;
    }

    // Validate required columns
    const requiredColumns = ["Date", "Workout Name", "Exercise Name", "Set Order"];
    for (const col of requiredColumns) {
      if (columnIndices[col] === undefined) {
        return {
          success: false,
          workouts: [],
          totalWorkouts: 0,
          totalExercises: 0,
          dateRange: { start: null, end: null },
          error: `Missing required column: ${col}`,
        };
      }
    }

    // Parse data rows
    const rows: StrongCSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);

      if (fields.length < 4) continue; // Skip malformed rows

      const row: StrongCSVRow = {
        date: fields[columnIndices["Date"]] || "",
        workoutName: fields[columnIndices["Workout Name"]] || "",
        duration: fields[columnIndices["Duration"]] || "",
        exerciseName: fields[columnIndices["Exercise Name"]] || "",
        setOrder: parseInt(fields[columnIndices["Set Order"]] || "1", 10),
        weight: parseFloat(fields[columnIndices["Weight"]]) || null,
        reps: parseInt(fields[columnIndices["Reps"]] || "0", 10) || null,
        distance: parseFloat(fields[columnIndices["Distance"]]) || null,
        seconds: parseInt(fields[columnIndices["Seconds"]] || "0", 10) || null,
        notes: fields[columnIndices["Notes"]] || null,
        workoutNotes: fields[columnIndices["Workout Notes"]] || null,
      };

      // Skip rows with no exercise name
      if (row.exerciseName) {
        rows.push(row);
      }
    }

    // Group rows by workout (Date + Workout Name)
    const workoutMap = new Map<string, StrongCSVRow[]>();

    for (const row of rows) {
      const key = `${row.date}|${row.workoutName}`;
      const existing = workoutMap.get(key) || [];
      existing.push(row);
      workoutMap.set(key, existing);
    }

    // Convert grouped rows to ParsedStrongWorkout objects
    const workouts: ParsedStrongWorkout[] = [];
    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    const exerciseNameSet = new Set<string>();

    for (const [, workoutRows] of workoutMap) {
      const firstRow = workoutRows[0];
      const workoutDate = parseStrongDate(firstRow.date);
      const workoutId = generateWorkoutId(workoutDate, firstRow.workoutName);
      const durationSeconds = parseDuration(firstRow.duration);

      // Update date range
      if (!minDate || workoutDate < minDate) minDate = workoutDate;
      if (!maxDate || workoutDate > maxDate) maxDate = workoutDate;

      // Group sets by exercise
      const exerciseMap = new Map<string, StrongCSVRow[]>();
      for (const row of workoutRows) {
        const existing = exerciseMap.get(row.exerciseName) || [];
        existing.push(row);
        exerciseMap.set(row.exerciseName, existing);
        exerciseNameSet.add(row.exerciseName);
      }

      // Convert to exercises array maintaining order
      const exerciseOrder: string[] = [];
      for (const row of workoutRows) {
        if (!exerciseOrder.includes(row.exerciseName)) {
          exerciseOrder.push(row.exerciseName);
        }
      }

      const exercises: ParsedStrongExercise[] = exerciseOrder.map((exerciseName) => {
        const exerciseRows = exerciseMap.get(exerciseName) || [];
        const sets: ParsedStrongSet[] = exerciseRows.map((row) => ({
          setNumber: row.setOrder,
          weight: row.weight,
          reps: row.reps,
          isWarmup: false, // Strong doesn't export warmup info
        }));

        return {
          name: exerciseName,
          sets,
        };
      });

      workouts.push({
        id: workoutId,
        date: workoutDate,
        name: firstRow.workoutName,
        durationSeconds,
        exercises,
        notes: firstRow.workoutNotes,
        selected: true, // Default to selected for import
      });
    }

    // Sort workouts by date (newest first for display)
    workouts.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      success: true,
      workouts,
      totalWorkouts: workouts.length,
      totalExercises: exerciseNameSet.size,
      dateRange: {
        start: minDate,
        end: maxDate,
      },
    };
  } catch (error) {
    return {
      success: false,
      workouts: [],
      totalWorkouts: 0,
      totalExercises: 0,
      dateRange: { start: null, end: null },
      error: error instanceof Error ? error.message : "Failed to parse CSV",
    };
  }
}
