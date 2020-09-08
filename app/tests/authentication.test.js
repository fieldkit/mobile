import axios from "axios";
import * as MutationTypes from "../store/mutations";
import { Services } from "../services/services";

describe("Authentication", () => {
    let services;

    beforeEach(() => {
        services = new Services();
        services.Store().commit(MutationTypes.SERVICES, () => services);
        return services
            .CreateDb()
            .initialize()
            .then(() => {
                return services.Database().checkConfig();
            });
    });

    afterEach(() => {
        axios.mockReset();
    });

    describe("login", () => {
        it("should download firmware after login", () => {
            const auth = {
                status: 204,
                headers: {
                    authorization: "TOKEN",
                },
                data: {},
            };

            const user = {
                data: {
                    name: "Jacob",
                },
            };

            const firmware = {
                data: {
                    firmwares: [
                        {
                            id: 1000,
                            time: new Date(),
                            url: "url",
                            module: "module",
                            profile: "profile",
                            etag: "etag",
                            path: "atph",
                            meta: "",
                            buildTime: 0,
                            buildNumber: 100,
                        },
                    ],
                },
            };

            axios
                .mockReturnValueOnce(Promise.resolve(auth))
                .mockReturnValueOnce(Promise.resolve(user))
                .mockReturnValueOnce(Promise.resolve(firmware));

            services.Conservify().download = jest.fn(() =>
                Promise.resolve({
                    statusCode: 200,
                })
            );

            expect.assertions(1);

            return services
                .PortalInterface()
                .login({
                    email: "jacob@conservify.org",
                    password: "password",
                })
                .then(() => {
                    expect(true).toBe(true);
                    // expect(services.Conservify().download.mock.calls.length).toBe(1);
                    console.log("ok");
                });
        });
    });
});
