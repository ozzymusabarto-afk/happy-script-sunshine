import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { longDate } from "./tone";

describe("visitor-local calendar at the reported UTC boundary", () => {
  test("October 23 at 01:38 UTC is still Thursday October 22 in São Paulo", () => {
    assert.equal(new Date("2026-10-23T01:38:00Z").getDate(), 22);
    assert.equal(new Date("2026-10-23T01:38:00Z").getDay(), 4);
    assert.equal(longDate(new Date("2026-10-23T01:38:00Z")), "Quinta-feira, 22 de outubro");
  });
  test("the date changes only at local midnight", () => {
    assert.equal(new Date("2026-10-23T02:59:59Z").getDate(), 22);
    assert.equal(new Date("2026-10-23T03:00:00Z").getDate(), 23);
    assert.equal(longDate(new Date("2026-10-23T03:00:00Z")), "Sexta-feira, 23 de outubro");
  });
});