export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "abs";

export type ExerciseCategory = "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight";

export interface Exercise {
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
}

export const EXERCISES: Exercise[] = [
  // CHEST - Barbell (5)
  {
    name: "Barbell Bench Press",
    category: "barbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
  },
  {
    name: "Incline Barbell Bench Press",
    category: "barbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
  },
  {
    name: "Decline Barbell Bench Press",
    category: "barbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps"],
  },
  {
    name: "Close-Grip Bench Press",
    category: "barbell",
    primaryMuscles: ["chest", "triceps"],
    secondaryMuscles: ["shoulders"],
  },
  {
    name: "Barbell Floor Press",
    category: "barbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
  },

  // CHEST - Dumbbell (5)
  {
    name: "Dumbbell Bench Press",
    category: "dumbbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
  },
  {
    name: "Incline Dumbbell Bench Press",
    category: "dumbbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
  },
  {
    name: "Dumbbell Flyes",
    category: "dumbbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: [],
  },
  {
    name: "Incline Dumbbell Flyes",
    category: "dumbbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: [],
  },
  {
    name: "Dumbbell Pullover",
    category: "dumbbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["back"],
  },

  // CHEST - Machine/Cable (4)
  {
    name: "Cable Crossover",
    category: "cable",
    primaryMuscles: ["chest"],
    secondaryMuscles: [],
  },
  {
    name: "Low Cable Crossover",
    category: "cable",
    primaryMuscles: ["chest"],
    secondaryMuscles: [],
  },
  {
    name: "Chest Press Machine",
    category: "machine",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
  },
  {
    name: "Pec Deck Machine",
    category: "machine",
    primaryMuscles: ["chest"],
    secondaryMuscles: [],
  },

  // CHEST - Bodyweight (2)
  {
    name: "Push-Up",
    category: "bodyweight",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
  },
  {
    name: "Dip (Chest)",
    category: "bodyweight",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
  },

  // BACK - Barbell (5)
  {
    name: "Barbell Row",
    category: "barbell",
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps"],
  },
  {
    name: "Pendlay Row",
    category: "barbell",
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps"],
  },
  {
    name: "T-Bar Row",
    category: "barbell",
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps"],
  },
  {
    name: "Deadlift",
    category: "barbell",
    primaryMuscles: ["back", "hamstrings", "glutes"],
    secondaryMuscles: ["quads"],
  },
  {
    name: "Rack Pull",
    category: "barbell",
    primaryMuscles: ["back"],
    secondaryMuscles: ["hamstrings", "glutes"],
  },

  // BACK - Dumbbell (4)
  {
    name: "Dumbbell Row",
    category: "dumbbell",
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps"],
  },
  {
    name: "Incline Dumbbell Row",
    category: "dumbbell",
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps"],
  },
  {
    name: "Dumbbell Shrug",
    category: "dumbbell",
    primaryMuscles: ["back"],
    secondaryMuscles: [],
  },
  {
    name: "Dumbbell Reverse Fly",
    category: "dumbbell",
    primaryMuscles: ["back"],
    secondaryMuscles: ["shoulders"],
  },

  // BACK - Machine/Cable (5)
  {
    name: "Lat Pulldown",
    category: "cable",
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps"],
  },
  {
    name: "Close-Grip Lat Pulldown",
    category: "cable",
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps"],
  },
  {
    name: "Seated Cable Row",
    category: "cable",
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps"],
  },
  {
    name: "Face Pull",
    category: "cable",
    primaryMuscles: ["back", "shoulders"],
    secondaryMuscles: [],
  },
  {
    name: "Cable Pullover",
    category: "cable",
    primaryMuscles: ["back"],
    secondaryMuscles: ["chest"],
  },

  // BACK - Bodyweight (2)
  {
    name: "Pull-Up",
    category: "bodyweight",
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps"],
  },
  {
    name: "Chin-Up",
    category: "bodyweight",
    primaryMuscles: ["back"],
    secondaryMuscles: ["biceps"],
  },

  // SHOULDERS - Barbell (4)
  {
    name: "Overhead Press",
    category: "barbell",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps"],
  },
  {
    name: "Push Press",
    category: "barbell",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps", "quads"],
  },
  {
    name: "Barbell Front Raise",
    category: "barbell",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: [],
  },
  {
    name: "Barbell Upright Row",
    category: "barbell",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["biceps"],
  },

  // SHOULDERS - Dumbbell (5)
  {
    name: "Dumbbell Shoulder Press",
    category: "dumbbell",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps"],
  },
  {
    name: "Arnold Press",
    category: "dumbbell",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps"],
  },
  {
    name: "Dumbbell Lateral Raise",
    category: "dumbbell",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: [],
  },
  {
    name: "Dumbbell Front Raise",
    category: "dumbbell",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: [],
  },
  {
    name: "Dumbbell Rear Delt Fly",
    category: "dumbbell",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["back"],
  },

  // SHOULDERS - Machine/Cable (3)
  {
    name: "Cable Lateral Raise",
    category: "cable",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: [],
  },
  {
    name: "Cable Front Raise",
    category: "cable",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: [],
  },
  {
    name: "Shoulder Press Machine",
    category: "machine",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps"],
  },

  // BICEPS - Barbell (3)
  {
    name: "Barbell Curl",
    category: "barbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
  },
  {
    name: "EZ-Bar Curl",
    category: "barbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
  },
  {
    name: "Preacher Curl (Barbell)",
    category: "barbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
  },

  // BICEPS - Dumbbell (4)
  {
    name: "Dumbbell Curl",
    category: "dumbbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
  },
  {
    name: "Hammer Curl",
    category: "dumbbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
  },
  {
    name: "Incline Dumbbell Curl",
    category: "dumbbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
  },
  {
    name: "Concentration Curl",
    category: "dumbbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
  },

  // BICEPS - Cable (2)
  {
    name: "Cable Curl",
    category: "cable",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
  },
  {
    name: "Cable Hammer Curl",
    category: "cable",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
  },

  // TRICEPS - Barbell (2)
  {
    name: "Skull Crusher",
    category: "barbell",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },
  {
    name: "Barbell Overhead Tricep Extension",
    category: "barbell",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },

  // TRICEPS - Dumbbell (3)
  {
    name: "Dumbbell Overhead Tricep Extension",
    category: "dumbbell",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },
  {
    name: "Dumbbell Kickback",
    category: "dumbbell",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },
  {
    name: "Dumbbell Close-Grip Press",
    category: "dumbbell",
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["chest"],
  },

  // TRICEPS - Cable (3)
  {
    name: "Tricep Pushdown",
    category: "cable",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },
  {
    name: "Rope Pushdown",
    category: "cable",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },
  {
    name: "Cable Overhead Tricep Extension",
    category: "cable",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },

  // TRICEPS - Bodyweight (2)
  {
    name: "Dip (Tricep)",
    category: "bodyweight",
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["chest", "shoulders"],
  },
  {
    name: "Diamond Push-Up",
    category: "bodyweight",
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["chest"],
  },

  // QUADS - Barbell (4)
  {
    name: "Barbell Squat",
    category: "barbell",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes", "hamstrings"],
  },
  {
    name: "Front Squat",
    category: "barbell",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
  },
  {
    name: "Barbell Lunge",
    category: "barbell",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes", "hamstrings"],
  },
  {
    name: "Hack Squat (Barbell)",
    category: "barbell",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
  },

  // QUADS - Dumbbell (3)
  {
    name: "Goblet Squat",
    category: "dumbbell",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
  },
  {
    name: "Dumbbell Lunge",
    category: "dumbbell",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes", "hamstrings"],
  },
  {
    name: "Dumbbell Step-Up",
    category: "dumbbell",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
  },

  // QUADS - Machine (4)
  {
    name: "Leg Press",
    category: "machine",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes", "hamstrings"],
  },
  {
    name: "Hack Squat Machine",
    category: "machine",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
  },
  {
    name: "Leg Extension",
    category: "machine",
    primaryMuscles: ["quads"],
    secondaryMuscles: [],
  },
  {
    name: "Smith Machine Squat",
    category: "machine",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes", "hamstrings"],
  },

  // QUADS - Bodyweight (1)
  {
    name: "Bodyweight Squat",
    category: "bodyweight",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
  },

  // HAMSTRINGS - Barbell (3)
  {
    name: "Romanian Deadlift",
    category: "barbell",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes", "back"],
  },
  {
    name: "Stiff-Leg Deadlift",
    category: "barbell",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes", "back"],
  },
  {
    name: "Good Morning",
    category: "barbell",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes", "back"],
  },

  // HAMSTRINGS - Dumbbell (2)
  {
    name: "Dumbbell Romanian Deadlift",
    category: "dumbbell",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes", "back"],
  },
  {
    name: "Dumbbell Single-Leg Deadlift",
    category: "dumbbell",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes"],
  },

  // HAMSTRINGS - Machine (3)
  {
    name: "Lying Leg Curl",
    category: "machine",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: [],
  },
  {
    name: "Seated Leg Curl",
    category: "machine",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: [],
  },
  {
    name: "Glute-Ham Raise Machine",
    category: "machine",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes"],
  },

  // GLUTES - Barbell (2)
  {
    name: "Barbell Hip Thrust",
    category: "barbell",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
  },
  {
    name: "Sumo Deadlift",
    category: "barbell",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "quads", "back"],
  },

  // GLUTES - Dumbbell (2)
  {
    name: "Dumbbell Hip Thrust",
    category: "dumbbell",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
  },
  {
    name: "Dumbbell Sumo Squat",
    category: "dumbbell",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["quads"],
  },

  // GLUTES - Cable/Machine (2)
  {
    name: "Cable Pull-Through",
    category: "cable",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
  },
  {
    name: "Cable Kickback",
    category: "cable",
    primaryMuscles: ["glutes"],
    secondaryMuscles: [],
  },

  // GLUTES - Bodyweight (2)
  {
    name: "Glute Bridge",
    category: "bodyweight",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
  },
  {
    name: "Bulgarian Split Squat",
    category: "bodyweight",
    primaryMuscles: ["glutes", "quads"],
    secondaryMuscles: ["hamstrings"],
  },

  // CALVES - Machine (3)
  {
    name: "Standing Calf Raise",
    category: "machine",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
  },
  {
    name: "Seated Calf Raise",
    category: "machine",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
  },
  {
    name: "Leg Press Calf Raise",
    category: "machine",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
  },

  // CALVES - Dumbbell (1)
  {
    name: "Dumbbell Calf Raise",
    category: "dumbbell",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
  },

  // CALVES - Bodyweight (1)
  {
    name: "Bodyweight Calf Raise",
    category: "bodyweight",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
  },

  // ABS - Bodyweight (5)
  {
    name: "Crunch",
    category: "bodyweight",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
  },
  {
    name: "Leg Raise",
    category: "bodyweight",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
  },
  {
    name: "Hanging Leg Raise",
    category: "bodyweight",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
  },
  {
    name: "Plank",
    category: "bodyweight",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
  },
  {
    name: "Mountain Climber",
    category: "bodyweight",
    primaryMuscles: ["abs"],
    secondaryMuscles: ["quads"],
  },

  // ABS - Cable (2)
  {
    name: "Cable Crunch",
    category: "cable",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
  },
  {
    name: "Cable Woodchop",
    category: "cable",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
  },

  // ABS - Machine (1)
  {
    name: "Ab Machine Crunch",
    category: "machine",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
  },
];

// Utility function to get exercises by muscle group
export function getExercisesByMuscle(muscle: MuscleGroup): Exercise[] {
  return EXERCISES.filter(
    (exercise) =>
      exercise.primaryMuscles.includes(muscle) || exercise.secondaryMuscles.includes(muscle),
  );
}

// Utility function to get exercises by category
export function getExercisesByCategory(category: ExerciseCategory): Exercise[] {
  return EXERCISES.filter((exercise) => exercise.category === category);
}
