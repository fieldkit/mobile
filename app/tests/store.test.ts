import storeFactory from "../store";

describe("Store", () => {
    let store;

    beforeEach(() => {
        store = storeFactory();
    });

    afterEach(() => {});

    describe("created", () => {
        it("should be blank to begin with", () => {});
    });
});
