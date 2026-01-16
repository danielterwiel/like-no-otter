import { describe, it, expect } from "vitest";
import { whoopRecovery, whoopSleep, whoopCycles } from "../lib/db/schema/whoop";

describe("Whoop schema", () => {
  it("exports whoopRecovery table with required columns", () => {
    expect(whoopRecovery).toBeDefined();
    const columns = Object.keys(whoopRecovery);
    expect(columns).toContain("id");
    expect(columns).toContain("date");
    expect(columns).toContain("recoveryScore");
    expect(columns).toContain("hrvRmssd");
    expect(columns).toContain("restingHeartRate");
    expect(columns).toContain("spo2");
    expect(columns).toContain("skinTemp");
    expect(columns).toContain("syncedAt");
  });

  it("exports whoopSleep table with required columns", () => {
    expect(whoopSleep).toBeDefined();
    const columns = Object.keys(whoopSleep);
    expect(columns).toContain("id");
    expect(columns).toContain("date");
    expect(columns).toContain("startTime");
    expect(columns).toContain("endTime");
    expect(columns).toContain("qualityDuration");
    expect(columns).toContain("remDuration");
    expect(columns).toContain("deepDuration");
    expect(columns).toContain("lightDuration");
    expect(columns).toContain("awakeDuration");
    expect(columns).toContain("respiratoryRate");
    expect(columns).toContain("syncedAt");
  });

  it("exports whoopCycles table with required columns", () => {
    expect(whoopCycles).toBeDefined();
    const columns = Object.keys(whoopCycles);
    expect(columns).toContain("id");
    expect(columns).toContain("date");
    expect(columns).toContain("strain");
    expect(columns).toContain("kilojoules");
    expect(columns).toContain("avgHeartRate");
    expect(columns).toContain("maxHeartRate");
    expect(columns).toContain("syncedAt");
  });
});
