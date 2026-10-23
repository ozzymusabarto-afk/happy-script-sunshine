import { describe, expect, test } from "bun:test";
import { longDate } from "./tone";

describe("visitor-local calendar at the reported UTC boundary", () => {
  test("October 23 at 01:38 UTC is still Thursday October 22 in São Paulo", () => {
    expect(new Date("2026-10-23T01:38:00Z").getDate()).toBe(22);
    expect(new Date("2026-10-23T01:38:00Z").getDay()).toBe(4);
    expect(longDate(new Date("2026-10-23T01:38:00Z"))).toBe("Quinta-feira, 22 de outubro");
  });
  test("the date changes only at local midnight", () => {
    expect(new Date("2026-10-23T02:59:59Z").getDate()).toBe(22);
    expect(new Date("2026-10-23T03:00:00Z").getDate()).toBe(23);
  });
});