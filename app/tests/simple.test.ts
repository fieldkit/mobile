import { describe, expect, it } from "@jest/globals";
import { fk_app } from "fk-app-protocol/fk-app";
import { decodeAndPrepare } from "@/store";
const HttpReply = fk_app.HttpReply;

describe("simple tests", () => {
    describe("protobuf message decoder", () => {
        it("should decode", () => {
            const message =
                "lgcIDxqiAggBEKGRNxp6CgxGYW5jeSBDb3cgNTQaEE+xoVVTNlcyMiAgIP8ZOBEiKGZkNzU1ZDU2Y2YxMjA0OGExMjQ3NDk3M2Q1NWU1YjNlNDk0MTE4YzMyDEZhbmN5IENvdyA1NDognjVbf2IGqM7kfJ3QP0OTvBekE8lGgABzfGl38B1ttycqDAoFCIAdEB4SAwj4BjIWCEwQwNslGICAgAQggICAgAIotZrKAjoKJWUl7MItxlMJQkoAWMzntoEGYmQKABItZmstYnVuZGxlZC1ma2IuZWxmX0pBQ09CLUhPTUVfMjAyMTAyMThfMDAwODIxGgEwIPXftoEGKihmZDc1NWQ1NmNmMTIwNDhhMTI0NzQ5NzNkNTVlNWIzZTQ5NDExOGMzIjQSFgoKQ290dG9ud29vZBIIYXNkZmFzZGYaDAoKQ290dG9ud29vZCIMZTU0Yjc2MDVmMGY4KtICCP8BEhNtb2R1bGVzLmRpYWdub3N0aWNzGhUaDmJhdHRlcnlfY2hhcmdlKgElMgAaFQgBGgxiYXR0ZXJ5X3ZidXMqAXYyABoUCAIaCmJhdHRlcnlfdnMqAm12MgAaFAgDGgpiYXR0ZXJ5X21hKgJtYTIAGhcIBBoNYmF0dGVyeV9wb3dlcioCbXcyABoTCAUaCnNvbGFyX3ZidXMqAXYyABoSCAYaCHNvbGFyX3ZzKgJtdjIAGhIIBxoIc29sYXJfbWEqAm1hMgAaFQgIGgtzb2xhcl9wb3dlcioCbXcyABoYCAkaC2ZyZWVfbWVtb3J5KgVieXRlczIAGhAIChoGdXB0aW1lKgJtczIAGhQICxoLdGVtcGVyYXR1cmUqAUMyACISL2ZrL3YxL21vZHVsZXMvMjU1KAEyEDsZPqFq6QPeIwnbk5/vJ1o6BwgBEKEBGAEqSggDEhBtb2R1bGVzLndhdGVyLnBoGggaAnBoKgAyACIQL2ZrL3YxL21vZHVsZXMvMzIQ8SkmHGw2slcSr7REgPrtozoGCAEQAhgBMioYpr7IAiiQtwI6CWRhdGEuZmtwYkIUL2ZrL3YxL2Rvd25sb2FkL2RhdGEyKQgBGI/cASg1OgltZXRhLmZrcGJCFC9may92MS9kb3dubG9hZC9tZXRhQiYaCAAAAAAAAAAAIhAAAAAAAAAAAAAAAAAAAAAAKggAAAAAAAAAAEoXEgoQPDIGEICjBRg8GgAiAiA8KgMg2AQ=";

            const buffer = Buffer.from(message, "base64");

            expect(HttpReply.decodeDelimited(buffer)).toBeDefined();
            expect(decodeAndPrepare(buffer, message)).toBeDefined();
        });
    });
});
