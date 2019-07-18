import Sqlite from "../wrappers/sqlite";
import DatabaseInterface from "../services/db-interface";

describe("Sqlite Wrapper", () => {
    let sqlite;

    beforeAll(() => {
        sqlite = new Sqlite();
    });

    describe("no existing database", () => {
        it("opening should open new database", () => {
            expect.assertions(1);

            return expect(
                sqlite.open(":memory:").then(db => {
                    return db;
                })
            ).resolves.toBeDefined();
        });

        it("opening and executing wellformed CREATE TABLE", () => {
            expect.assertions(1);

            return expect(
                sqlite.open(":memory:").then(db => {
                    return db.execute(
                        "CREATE TABLE people (id INTEGER PRIMARY KEY, name TEXT)"
                    );
                })
            ).resolves.toBeDefined();
        });

        it("opening and executing malformed CREATE TABLE", () => {
            expect.assertions(1);

            return expect(
                sqlite.open(":memory:").then(db => {
                    return db.execute(
                        "CREATE NOTABLE people (id INTEGER PRIMARY KEY, name TEXT)"
                    );
                })
            ).rejects.toBeDefined();
        });
    });

    describe("with a database with some data", () => {
        let testdb;

        beforeAll(() => {
            return sqlite
                .open(":memory:")
                .then(db => {
                    return db.execute(
                        "CREATE TABLE people (id INTEGER PRIMARY KEY, name TEXT)"
                    );
                })
                .then(db => {
                    return db.execute(
                        "INSERT INTO people (id, name) VALUES (NULL, 'Jacob')"
                    );
                })
                .then(db => {
                    return db.execute(
                        "INSERT INTO people (id, name) VALUES (NULL, 'Libbey')"
                    );
                })
                .then(db => {
                    return db.execute(
                        "INSERT INTO people (id, name) VALUES (NULL, 'Bradley')"
                    );
                })
                .then(db => {
                    return db.execute(
                        "INSERT INTO people (id, name) VALUES (NULL, 'Shah')"
                    );
                })
                .then(db => {
                    testdb = db;
                    return db;
                });
        });

        describe("plain query", () => {
            it("should return expected rows", () => {
                expect.assertions(1);

                return expect(
                    testdb.query("SELECT * FROM people")
                ).resolves.toEqual([
                    { id: 1, name: "Jacob" },
                    { id: 2, name: "Libbey" },
                    { id: 3, name: "Bradley" },
                    { id: 4, name: "Shah" }
                ]);
            });
        });

        describe("query with parameters", () => {
            it("should return expected rows when matching", () => {
                expect.assertions(1);

                return expect(
                    testdb.query("SELECT * FROM people WHERE id = $id", {
                        $id: 4
                    })
                ).resolves.toEqual([{ id: 4, name: "Shah" }]);
            });

            it("should return no rows when none match", () => {
                expect.assertions(1);

                return expect(
                    testdb.query("SELECT * FROM people WHERE id = $id", {
                        $id: 8
                    })
                ).resolves.toEqual([]);
            });
        });
    });

    describe("Create DB", () => {
        it("should successfully create a new database", () => {
            expect.assertions(1);

            return expect(
                new DatabaseInterface().getDatabase(db => {
                    console.log(db);
                    return db;
                })
            ).resolves.toBeDefined();
        });
    });
});
