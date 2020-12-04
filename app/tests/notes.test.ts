import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import FakeTimers from "@sinonjs/fake-timers";
import { ServicesImpl, SynchronizeNotes, PatchPortalNotes, Ids } from "@/services";
import { Notes, SaveNotesAction, UpdateNoteMutation } from "@/store";

describe("Notes", () => {
    let services;
    let store;
    let clock;

    beforeEach(async () => {
        clock = FakeTimers.install({ shouldAdvanceTime: true, advanceTimeDelta: 1000 });
        clock.tick(10);

        services = new ServicesImpl();
        await services.CreateDb().initialize();

        store = services.Store();
    });

    afterEach(() => {});

    describe("no portal authentication", () => {
        it("should fail", async () => {
            expect.assertions(1);

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store, services.FileSystem());

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

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store, services.FileSystem());
            await synchronize.synchronize(new Ids(200, 100));

            expect(patches.mock.calls.length).toBe(0);
            expect(addOrUpdates.mock.calls.length).toBe(0);
        });
    });

    describe("no mobile notes and portal notes", () => {
        it("should keep the portal notes and save them", async () => {
            expect.assertions(3);

            const patches = jest.fn();
            const addOrUpdates = jest.fn(() => {
                return Promise.resolve();
            });

            services.Database().addOrUpdateNotes = addOrUpdates;
            services.PortalInterface().updateStationNotes = patches;

            clock.tick(63030);

            services.PortalInterface().getStationNotes = () => {
                return Promise.resolve({
                    notes: [{ key: "studyObjective", createdAt: new Date(), updatedAt: new Date(), body: "Portal Note", media: [] }],
                    media: [],
                });
            };

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store, services.FileSystem());
            await synchronize.synchronize(new Ids(200, 100));

            expect(patches.mock.calls.length).toBe(0);
            expect(addOrUpdates.mock.calls.length).toBe(1);

            const [saved] = (addOrUpdates.mock.calls[0] as unknown) as [Notes];

            expect(saved.studyObjective.body).toBe("Portal Note");
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

            store.commit(new UpdateNoteMutation(ids.mobile, "studyObjective", { body: "Mobile Note" }));

            await store.dispatch(new SaveNotesAction(ids.mobile));

            addOrUpdates.mockClear();

            services.Database().addOrUpdateNotes = addOrUpdates;
            services.PortalInterface().updateStationNotes = patches;

            clock.tick(60000);

            services.PortalInterface().getStationNotes = () => {
                return Promise.resolve({
                    notes: [{ key: "studyObjective", createdAt: new Date(), updatedAt: new Date(), body: "Portal Note", media: [] }],
                    media: [],
                });
            };

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store, services.FileSystem());
            await synchronize.synchronize(ids);

            expect(patches.mock.calls.length).toBe(0);
            expect(addOrUpdates.mock.calls.length).toBe(1);

            const [saved] = (addOrUpdates.mock.calls[0] as unknown) as [Notes];

            expect(saved.studyObjective.body).toBe("Portal Note");
        });
    });

    describe("notes everywhere and mobile is newer", () => {
        it("should keep the mobile notes and patch portal", async () => {
            expect.assertions(4);

            const ids = new Ids(200, 100);
            const patches = jest.fn(() => {
                return Promise.resolve();
            });
            const addOrUpdates = jest.fn(() => {
                return Promise.resolve();
            });

            services.Database().addOrUpdateNotes = addOrUpdates;
            services.PortalInterface().updateStationNotes = patches;

            services.PortalInterface().getStationNotes = () => {
                return Promise.resolve({
                    notes: [{ key: "studyObjective", createdAt: new Date(), updatedAt: new Date(), body: "Portal Note", media: [] }],
                    media: [],
                });
            };

            clock.tick(60000);

            store.commit(new UpdateNoteMutation(ids.mobile, "studyObjective", { body: "Mobile Note" }));

            await store.dispatch(new SaveNotesAction(ids.mobile));

            addOrUpdates.mockClear();

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store, services.FileSystem());
            await synchronize.synchronize(ids);

            expect(patches.mock.calls.length).toBe(1);
            expect(addOrUpdates.mock.calls.length).toBe(0);

            const [id, saved] = (patches.mock.calls[0] as unknown) as [number, PatchPortalNotes];

            expect(id).toBe(ids.portal);
            expect(saved.notes[0].body).toBe("Mobile Note");
        });
    });

    describe("notes everywhere and mobile is newer and had text emptied", () => {
        it("should keep the mobile notes and patch portal", async () => {
            expect.assertions(4);

            const ids = new Ids(200, 100);
            const patches = jest.fn(() => {
                return Promise.resolve();
            });
            const addOrUpdates = jest.fn(() => {
                return Promise.resolve();
            });

            services.Database().addOrUpdateNotes = addOrUpdates;
            services.PortalInterface().updateStationNotes = patches;

            services.PortalInterface().getStationNotes = () => {
                return Promise.resolve({
                    notes: [{ key: "studyObjective", createdAt: new Date(), updatedAt: new Date(), body: "Portal Note", media: [] }],
                    media: [],
                });
            };

            clock.tick(60000);

            store.commit(new UpdateNoteMutation(ids.mobile, "studyObjective", { body: "" }));

            await store.dispatch(new SaveNotesAction(ids.mobile));

            addOrUpdates.mockClear();

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store, services.FileSystem());
            await synchronize.synchronize(ids);

            expect(patches.mock.calls.length).toBe(1);
            expect(addOrUpdates.mock.calls.length).toBe(0);

            const [id, saved] = (patches.mock.calls[0] as unknown) as [number, PatchPortalNotes];

            expect(id).toBe(ids.portal);
            expect(saved.notes[0].body).toBe("");
        });
    });

    describe("notes everywhere and portal is newer and portal has media", () => {
        it("should keep the portal notes and save them", async () => {
            expect.assertions(4);

            const ids = new Ids(200, 100);
            const downloads = jest.fn(() => {
                return Promise.resolve();
            });
            const patches = jest.fn();
            const addOrUpdates = jest.fn(() => {
                return Promise.resolve();
            });

            store.commit(new UpdateNoteMutation(ids.mobile, "studyObjective", { body: "Mobile Note" }));

            await store.dispatch(new SaveNotesAction(ids.mobile));

            addOrUpdates.mockClear();

            services.Database().addOrUpdateNotes = addOrUpdates;
            services.PortalInterface().updateStationNotes = patches;
            services.PortalInterface().downloadStationMedia = downloads;

            clock.tick(60000);

            services.PortalInterface().getStationNotes = () => {
                return Promise.resolve({
                    notes: [{ key: "studyObjective", createdAt: new Date(), updatedAt: new Date(), body: "Portal Note", media: [] }],
                    media: [
                        {
                            id: 12,
                            contentType: "image/jpeg",
                            url: "file:///20200715_103218.jpg",
                            key: "20200715_103218.jpg",
                        },
                    ],
                });
            };

            const synchronize = new SynchronizeNotes(services.PortalInterface(), store, services.FileSystem());
            await synchronize.synchronize(ids);

            expect(patches.mock.calls.length).toBe(0);
            expect(addOrUpdates.mock.calls.length).toBe(1);
            expect(downloads.mock.calls.length).toBe(1);

            const [saved] = (addOrUpdates.mock.calls[0] as unknown) as [Notes];

            expect(saved.studyObjective.body).toBe("Portal Note");
        });
    });
});
