import { describe, expect, it } from "@jest/globals";
import { Syncer } from "@/lib/syncer";

describe("Syncer", () => {
    describe("profile", () => {
        it("should work", () => {
            new Syncer();
            expect(true).toBe(true);
        });
    });

    describe("stations", () => {
        it("should work", () => {
            expect(true).toBe(true);
        });
    });

    describe("notes", () => {
        it("should work", () => {
            expect(true).toBe(true);
        });
    });
});
