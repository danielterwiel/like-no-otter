import { describe, it, expect } from "vitest";
import * as schema from "../lib/db/schema";

describe("Database Schema", () => {
  describe("workouts schema", () => {
    it("exports workouts table", () => {
      expect(schema.workouts).toBeDefined();
    });

    it("exports exercises table", () => {
      expect(schema.exercises).toBeDefined();
    });

    it("exports workoutExercises table", () => {
      expect(schema.workoutExercises).toBeDefined();
    });

    it("exports workoutSets table", () => {
      expect(schema.workoutSets).toBeDefined();
    });
  });

  describe("health schema", () => {
    it("exports healthMetrics table", () => {
      expect(schema.healthMetrics).toBeDefined();
    });
  });

  describe("tasks schema", () => {
    it("exports tasks table", () => {
      expect(schema.tasks).toBeDefined();
    });
  });
});
