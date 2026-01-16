import { setup, assign, fromCallback } from "xstate";
import type { ExerciseRecord } from "@/lib/db";

export const DEFAULT_REST_DURATION = 90; // seconds
export const MIN_REST_DURATION = 30; // seconds
export const MAX_REST_DURATION = 300; // 5 minutes

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
  restDurationSeconds: number;
  restRemainingSeconds: number;
}

export type WorkoutEvent =
  | { type: "START"; exercises: ExerciseRecord[] }
  | { type: "TICK" }
  | { type: "REST_TICK" }
  | { type: "SKIP_REST" }
  | { type: "REST_COMPLETE" }
  | { type: "SET_REST_DURATION"; duration: number }
  | { type: "NEXT_EXERCISE" }
  | { type: "PREVIOUS_EXERCISE" }
  | { type: "GO_TO_EXERCISE"; index: number }
  | {
      type: "ADD_SET";
      exerciseIndex: number;
      weight: number | null;
      reps: number | null;
      isWarmup: boolean;
    }
  | { type: "DELETE_SET"; exerciseIndex: number; setIndex: number }
  | { type: "FINISH" }
  | { type: "CANCEL" };

const timerActor = fromCallback<WorkoutEvent>(({ sendBack }) => {
  const intervalId = setInterval(() => {
    sendBack({ type: "TICK" });
  }, 1000);
  return () => clearInterval(intervalId);
});

const restTimerActor = fromCallback<WorkoutEvent>(({ sendBack }) => {
  const intervalId = setInterval(() => {
    sendBack({ type: "REST_TICK" });
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
    restTimer: restTimerActor,
  },
}).createMachine({
  id: "workout",
  initial: "idle",
  context: {
    exercises: [],
    currentExerciseIndex: 0,
    startTime: null,
    elapsedSeconds: 0,
    restDurationSeconds: DEFAULT_REST_DURATION,
    restRemainingSeconds: 0,
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
            restRemainingSeconds: 0,
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
        SET_REST_DURATION: {
          actions: assign({
            restDurationSeconds: ({ event }) =>
              Math.max(MIN_REST_DURATION, Math.min(MAX_REST_DURATION, event.duration)),
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
        ADD_SET: {
          target: "resting",
          actions: assign({
            exercises: ({ context, event }) => {
              const exercises = [...context.exercises];
              const exerciseState = exercises[event.exerciseIndex];
              if (exerciseState) {
                const newSet: WorkoutSet = {
                  setNumber: exerciseState.sets.length + 1,
                  weight: event.weight,
                  reps: event.reps,
                  isWarmup: event.isWarmup,
                  completedAt: new Date(),
                };
                exercises[event.exerciseIndex] = {
                  ...exerciseState,
                  sets: [...exerciseState.sets, newSet],
                };
              }
              return exercises;
            },
            restRemainingSeconds: ({ context }) => context.restDurationSeconds,
          }),
        },
        DELETE_SET: {
          actions: assign({
            exercises: ({ context, event }) => {
              const exercises = [...context.exercises];
              const exerciseState = exercises[event.exerciseIndex];
              if (exerciseState && exerciseState.sets[event.setIndex]) {
                const newSets = exerciseState.sets
                  .filter((_, i) => i !== event.setIndex)
                  .map((set, i) => ({ ...set, setNumber: i + 1 }));
                exercises[event.exerciseIndex] = {
                  ...exerciseState,
                  sets: newSets,
                };
              }
              return exercises;
            },
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
            restRemainingSeconds: 0,
          }),
        },
      },
    },
    resting: {
      invoke: [
        {
          id: "timer",
          src: "timer",
        },
        {
          id: "restTimer",
          src: "restTimer",
        },
      ],
      on: {
        TICK: {
          actions: assign({
            elapsedSeconds: ({ context }) => context.elapsedSeconds + 1,
          }),
        },
        REST_TICK: [
          {
            guard: ({ context }) => context.restRemainingSeconds <= 1,
            target: "active",
            actions: assign({
              restRemainingSeconds: 0,
            }),
          },
          {
            actions: assign({
              restRemainingSeconds: ({ context }) => context.restRemainingSeconds - 1,
            }),
          },
        ],
        SKIP_REST: {
          target: "active",
          actions: assign({
            restRemainingSeconds: 0,
          }),
        },
        REST_COMPLETE: {
          target: "active",
          actions: assign({
            restRemainingSeconds: 0,
          }),
        },
        SET_REST_DURATION: {
          actions: assign({
            restDurationSeconds: ({ event }) =>
              Math.max(MIN_REST_DURATION, Math.min(MAX_REST_DURATION, event.duration)),
          }),
        },
        NEXT_EXERCISE: {
          target: "active",
          actions: assign({
            currentExerciseIndex: ({ context }) =>
              Math.min(context.currentExerciseIndex + 1, context.exercises.length - 1),
            restRemainingSeconds: 0,
          }),
        },
        PREVIOUS_EXERCISE: {
          target: "active",
          actions: assign({
            currentExerciseIndex: ({ context }) => Math.max(context.currentExerciseIndex - 1, 0),
            restRemainingSeconds: 0,
          }),
        },
        GO_TO_EXERCISE: {
          target: "active",
          actions: assign({
            currentExerciseIndex: ({ event, context }) =>
              Math.max(0, Math.min(event.index, context.exercises.length - 1)),
            restRemainingSeconds: 0,
          }),
        },
        DELETE_SET: {
          actions: assign({
            exercises: ({ context, event }) => {
              const exercises = [...context.exercises];
              const exerciseState = exercises[event.exerciseIndex];
              if (exerciseState && exerciseState.sets[event.setIndex]) {
                const newSets = exerciseState.sets
                  .filter((_, i) => i !== event.setIndex)
                  .map((set, i) => ({ ...set, setNumber: i + 1 }));
                exercises[event.exerciseIndex] = {
                  ...exerciseState,
                  sets: newSets,
                };
              }
              return exercises;
            },
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
            restRemainingSeconds: 0,
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

export function formatRestTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${pad(minutes)}:${pad(secs)}`;
}
