import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { Services } from "../services/services";
import FakeTimers from "@sinonjs/fake-timers";
// import { MockStationReplies } from "./utilities";

import SynchronizeNotes, { PatchPortalNotes, Ids } from "../services/synchronize-notes";
// import * as ActionTypes from "../store/actions";
import * as MutationTypes from "../store/mutations";

import { Notes, NoteForm, NoteHelp } from "../store/modules/notes";

describe("Notes", () => {
    let services;
    let store;
    let clock;
    // let mockStation;

    beforeEach(async () => {
        clock = FakeTimers.install({ shouldAdvanceTime: true, advanceTimeDelta: 1000 });
        clock.tick(10);

        services = new Services();
        await services.CreateDb().initialize();
        // mockStation = new MockStationReplies(services);

        store = services.Store();

        store.commit(MutationTypes.SERVICES, () => services);
    });

    afterEach(() => {});

    describe("no portal authentication", () => {
        it("should fail", async () => {
            expect.assertions(1);

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store);

            try {
                await synchronize.synchronize(new Ids(200, 100));
            } catch (err) {
                expect(err).toBeDefined();
            }
        });
    });

    describe("no portal notes and no mobile notes", () => {
        it("should see there's nothing to do and do nothing", async () => {
            expect.assertions(2);

            const patches = jest.fn();
            const addOrUpdates = jest.fn();

            services.Database().addOrUpdateNotes = addOrUpdates;
            services.PortalInterface().updateStationNotes = patches;

            services.PortalInterface().getStationNotes = () => {
                return Promise.resolve({
                    notes: [],
                    media: [],
                });
            };

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store);
            await synchronize.synchronize(new Ids(200, 100));

            expect(patches.mock.calls.length).toBe(0);
            expect(addOrUpdates.mock.calls.length).toBe(0);
        });
    });

    describe("no mobile notes and portal notes", () => {
        it("should keep the portal notes and save them", async () => {
            expect.assertions(3);

            const patches = jest.fn();
            const addOrUpdates = jest.fn();

            services.Database().addOrUpdateNotes = addOrUpdates;
            services.PortalInterface().updateStationNotes = patches;

            services.PortalInterface().getStationNotes = () => {
                return Promise.resolve({
                    notes: [{ key: "studyObjective", createdAt: new Date(), updatedAt: new Date(), body: "Portal Note", media: [] }],
                    media: [],
                });
            };

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store);
            await synchronize.synchronize(new Ids(200, 100));

            expect(patches.mock.calls.length).toBe(0);
            expect(addOrUpdates.mock.calls.length).toBe(1);

            const [saved] = addOrUpdates.mock.calls[0];

            expect(saved.form.studyObjective.body).toBe("Portal Note");
        });
    });

    describe("notes everywhere and portal is newer", () => {
        it("should keep the portal notes and save them", async () => {
            expect.assertions(3);

            const ids = new Ids(200, 100);
            const patches = jest.fn();
            const addOrUpdates = jest.fn(() => {
                return Promise.resolve();
            });

            const mobileNotes = new Notes(ids.mobile, new Date(), new Date());
            mobileNotes.form.studyObjective = new NoteForm(new NoteHelp("", ""), "Mobile Note");
            store.state.notes.stations[ids.mobile] = mobileNotes;

            services.Database().addOrUpdateNotes = addOrUpdates;
            services.PortalInterface().updateStationNotes = patches;

            clock.tick(60000);

            services.PortalInterface().getStationNotes = () => {
                return Promise.resolve({
                    notes: [{ key: "studyObjective", createdAt: new Date(), updatedAt: new Date(), body: "Portal Note", media: [] }],
                    media: [],
                });
            };

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store);
            await synchronize.synchronize(ids);

            expect(patches.mock.calls.length).toBe(0);
            expect(addOrUpdates.mock.calls.length).toBe(1);

            const [saved] = (addOrUpdates.mock.calls[0] as unknown) as [Notes];

            expect(saved.form.studyObjective.body).toBe("Portal Note");
        });
    });

    describe("notes everywhere and mobile is newer", () => {
        it("should keep the mobile notes and patch portal", async () => {
            expect.assertions(4);

            const ids = new Ids(200, 100);
            const patches = jest.fn(() => {
                return Promise.resolve();
            });
            const addOrUpdates = jest.fn();

            services.Database().addOrUpdateNotes = addOrUpdates;
            services.PortalInterface().updateStationNotes = patches;

            services.PortalInterface().getStationNotes = () => {
                return Promise.resolve({
                    notes: [{ key: "studyObjective", createdAt: new Date(), updatedAt: new Date(), body: "Portal Note", media: [] }],
                    media: [],
                });
            };

            clock.tick(60000);

            const mobileNotes = new Notes(ids.mobile, new Date(), new Date());
            mobileNotes.form.studyObjective = new NoteForm(new NoteHelp("", ""), "Mobile Note");
            store.state.notes.stations[ids.mobile] = mobileNotes;

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store);
            await synchronize.synchronize(ids);

            expect(patches.mock.calls.length).toBe(1);
            expect(addOrUpdates.mock.calls.length).toBe(0);

            const [id, saved] = (patches.mock.calls[0] as unknown) as [number, PatchPortalNotes];

            expect(id).toBe(ids.portal);
            expect(saved.notes[0].body).toBe("Mobile Note");
        });
    });
});
