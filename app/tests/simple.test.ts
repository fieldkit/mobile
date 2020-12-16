import { describe, expect, it } from "@jest/globals";
import { fk_app } from "fk-app-protocol/fk-app";
import { decodeAndPrepare } from "@/store";
const HttpReply = fk_app.HttpReply;

describe("simple tests", () => {
    describe("protobuf message decoder", () => {
        it("should decode", () => {
            const message =
                "hgsIEhq4AggBEKXqDhqGAQoSQ3JlYXRpdmUgQm9iY2F0IDIwGhDqEwM/UzU1MzQgICD/GEQdIigyNWI4YzgwNjA3MjFmYzBlZDFjNTdiY2Y5YjEzYzlmYzVmZTU4M2VmMhJDcmVhdGl2ZSBCb2JjYXQgMjA6IKURL2bLh4XWjGvSgqgBQ0R0Gak9BzjW1Boj+3y/UTiSKgkKBQjIHRAoEgAyFgi8ARD4hSYYgICABCCAgICAAijP5wE6EhCsrMf+BSUyiO3CLVy6CEI4AUoAWLOsx/4FYmgKABIvZmstYnVuZGxlZC1ma2IuZWxmX2RlOGIyM2U2ZWFiYl8yMDIwMTIwOV8wMjAzMDUaAzcyNSDZ4MD+BSooMjViOGM4MDYwNzIxZmMwZWQxYzU3YmNmOWIxM2M5ZmM1ZmU1ODNlZiIUGgQKABgBIgxlY2U5ZDMwNWYwZjgq0gII/wESE21vZHVsZXMuZGlhZ25vc3RpY3MaFRoOYmF0dGVyeV9jaGFyZ2UqASUyABoVCAEaDGJhdHRlcnlfdmJ1cyoBdjIAGhQIAhoKYmF0dGVyeV92cyoCbXYyABoUCAMaCmJhdHRlcnlfbWEqAm1hMgAaFwgEGg1iYXR0ZXJ5X3Bvd2VyKgJtdzIAGhMIBRoKc29sYXJfdmJ1cyoBdjIAGhIIBhoIc29sYXJfdnMqAm12MgAaEggHGghzb2xhcl9tYSoCbWEyABoVCAgaC3NvbGFyX3Bvd2VyKgJtdzIAGhgICRoLZnJlZV9tZW1vcnkqBWJ5dGVzMgAaEAgKGgZ1cHRpbWUqAm1zMgAaFAgLGgt0ZW1wZXJhdHVyZSoBQzIAIhIvZmsvdjEvbW9kdWxlcy8yNTUoATIQwtbkzywfxEafo9vhdvw6SjoHCAEQoQEYASp6CAESEG1vZHVsZXMud2F0ZXIuZWMaDhoCZWMqBsK1Uy9jbTIAGg4IARoDdGRzKgNwcG0yABoQCAIaCHNhbGluaXR5KgAyACIQL2ZrL3YxL21vZHVsZXMvMTIQGHtQa4VGc6yNmCJrkGpuAToGCAEQBRgBQgYIAxoCCAUyKBim0QEozgE6CWRhdGEuZmtwYkIUL2ZrL3YxL2Rvd25sb2FkL2RhdGEyKAgBGKkWKAY6CW1ldGEuZmtwYkIUL2ZrL3YxL2Rvd25sb2FkL21ldGE6xQMS3gIKNQj/ARITbW9kdWxlcy5kaWFnbm9zdGljcygBMhDC1uTPLB/ERp+j2+F2/DpKOgcIARChARgBEhoKExoOYmF0dGVyeV9jaGFyZ2UqASUVF0ciQhIaChMIARoMYmF0dGVyeV92YnVzKgF2FQ8tckASGQoSCAIaCmJhdHRlcnlfdnMqAm12FetRpkESFAoSCAMaCmJhdHRlcnlfbWEqAm1hEhcKFQgEGg1iYXR0ZXJ5X3Bvd2VyKgJtdxITChEIBRoKc29sYXJfdmJ1cyoBdhISChAIBhoIc29sYXJfdnMqAm12EhIKEAgHGghzb2xhcl9tYSoCbWESFQoTCAgaC3NvbGFyX3Bvd2VyKgJtdxIdChYICRoLZnJlZV9tZW1vcnkqBWJ5dGVzFQBesEcSFQoOCAoaBnVwdGltZSoCbXMVACRlSBIZChIICxoLdGVtcGVyYXR1cmUqAUMVAAC+QRJiCi4IARIQbW9kdWxlcy53YXRlci5lYzIQGHtQa4VGc6yNmCJrkGpuAToGCAEQBRgBEg4KDBoCZWMqBsK1Uy9jbRIOCgwIARoDdGRzKgNwcG0SEAoOCAIaCHNhbGluaXR5KgBCJhoIAAAAAAAAAAAiEAAAAAAAAAAAAAAAAAAAAAAqCAAAAAAAAAAAShwSAxCQHBoDEKA4IgcQwJcNIKwCKgcQgKMFINgE";

            const buffer = Buffer.from(message, "base64");

            expect(HttpReply.decodeDelimited(buffer)).toBeDefined();
            expect(decodeAndPrepare(buffer, message)).toBeDefined();
        });
    });
});
