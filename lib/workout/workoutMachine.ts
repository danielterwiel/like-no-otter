import { setup, assign, fromCallback } from "xstate";
import type { ExerciseRecord } from "@/lib/db";

export interface WorkoutSet {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  isWarmup: boolean;
  completedAt: Date | null;
}

export interface WorkoutExerciseState {
  exercise: ExerciseRecord;
  sets: WorkoutSet[];
}

export interface WorkoutContext {
  exercises: WorkoutExerciseState[];
  currentExerciseIndex: number;
  startTime: Date | null;
  elapsedSeconds: number;
}

export type WorkoutEvent =
  | { type: "START"; exercises: ExerciseRecord[] }
  | { type: "TICK" }
  | { type: "NEXT_EXERCISE" }
  | { type: "PREVIOUS_EXERCISE" }
  | { type: "GO_TO_EXERCISE"; index: number }
  | { type: "FINISH" }
  | { type: "CANCEL" };

const timerActor = fromCallback<WorkoutEvent>(({ sendBack }) => {
  const intervalId = setInterval(() => {
    sendBack({ type: "TICK" });
  }, 1000);
  return () => clearInterval(intervalId);
});

export const workoutMachine = setup({
  types: {
    context: {} as WorkoutContext,
    events: {} as WorkoutEvent,
  },
  actors: {
    timer: timerActor,
  },
}).createMachine({
  id: "workout",
  initial: "idle",
  context: {
    exercises: [],
    currentExerciseIndex: 0,
    startTime: null,
    elapsedSeconds: 0,
  },
  states: {
    idle: {
      on: {
        START: {
          target: "active",
          actions: assign({
            exercises: ({ event }) =>
              event.exercises.map((exercise: ExerciseRecord) => ({
                exercise,
                sets: [],
              })),
            currentExerciseIndex: 0,
            startTime: () => new Date(),
            elapsedSeconds: 0,
          }),
        },
      },
    },
    active: {
      invoke: {
        id: "timer",
        src: "timer",
      },
      on: {
        TICK: {
          actions: assign({
            elapsedSeconds: ({ context }) => context.elapsedSeconds + 1,
          }),
        },
        NEXT_EXERCISE: {
          actions: assign({
            currentExerciseIndex: ({ context }) =>
              Math.min(context.currentExerciseIndex + 1, context.exercises.length - 1),
          }),
        },
        PREVIOUS_EXERCISE: {
          actions: assign({
            currentExerciseIndex: ({ context }) => Math.max(context.currentExerciseIndex - 1, 0),
          }),
        },
        GO_TO_EXERCISE: {
          actions: assign({
            currentExerciseIndex: ({ event, context }) =>
              Math.max(0, Math.min(event.index, context.exercises.length - 1)),
          }),
        },
        FINISH: {
          target: "finished",
        },
        CANCEL: {
          target: "idle",
          actions: assign({
            exercises: [],
            currentExerciseIndex: 0,
            startTime: null,
            elapsedSeconds: 0,
          }),
        },
      },
    },
    finished: {
      type: "final",
    },
  },
});

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}
