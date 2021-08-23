import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { stateFor } from "@/store";
import { ServicesImpl } from "@/services";
import { MockStationReplies } from "./utilities";
import { StationRepliedAction, AccountsTableRow, MutationTypes } from "@/store";

describe("database", () => {
    describe("saving store log entries", () => {
        const mutation = { type: "IGNORE", payload: {} };
        let store;
        // let db;

        beforeEach(async () => {
            const services = new ServicesImpl();
            await services.CreateDb().initialize(null, false, false);
            const mockStation = new MockStationReplies(services);
            const fake = mockStation.newFakeStation();
            const reply = mockStation.newFakeStatusReply(fake, null, null);

            // db = services.Database();
            store = services.Store();
            await store.dispatch(new StationRepliedAction(reply, "http://10.0.01/fk/v1"));
            const rows: AccountsTableRow[] = [
                {
                    portalId: 1,
                    id: 1,
                    name: "Jacob",
                    usedAt: new Date(),
                    email: "EMAIL",
                    token: "TOKEN",
                    details: "{}",
                },
            ];
            store.commit(MutationTypes.LOAD_ACCOUNTS, rows);
        });

        it("should exclude serializedStatus", async () => {
            expect.assertions(2);

            expect(store.state.stations.all[0]["serializedStatus"]).toBeDefined();

            const afterRaw = stateFor(mutation, store.state);
            const after = JSON.parse(afterRaw);

            expect(after.stations.all[0]["serializedStatus"]).toBe("<excluded>");
        });

        it("should exclude decodedStatus", async () => {
            expect.assertions(2);

            expect(store.state.stations.all[0]["decodedStatus"]).toBeDefined();

            const afterRaw = stateFor(mutation, store.state);
            const after = JSON.parse(afterRaw);

            expect(after.stations.all[0]["decodedStatus"]).toBe("<excluded>");
        });

        it("should exclude token", async () => {
            expect.assertions(2);

            expect(store.state.portal.accounts[0].token).toBeDefined();

            const afterRaw = stateFor(mutation, store.state);
            const after = JSON.parse(afterRaw);

            expect(after.portal.accounts[0].token).toBe("<excluded>");
        });

        it("should exclude email", async () => {
            expect.assertions(2);

            expect(store.state.portal.accounts[0].email).toBeDefined();

            const afterRaw = stateFor(mutation, store.state);
            const after = JSON.parse(afterRaw);

            expect(after.portal.accounts[0].email).toBe("<excluded>");
        });

        it("should exclude password and passwordConfirmation", async () => {
            expect.assertions(2);

            const afterRaw = stateFor(mutation, { type: "IGNORE", password: "hunter42", passwordConfirmation: "hunter42" });
            const after = JSON.parse(afterRaw);

            expect(after.password).toBe("<excluded>");
            expect(after.passwordConfirmation).toBe("<excluded>");
        });
    });

    describe("saving store log entries", () => {
        // let store;
        let db;

        beforeEach(async () => {
            const services = new ServicesImpl();
            await services.CreateDb().initialize(null, false, false);

            db = services.Database();
            // store = services.Store();
        });

        it("purge old logs should wor", async () => {
            await db.purgeOldLogs();
        });
    });
});
