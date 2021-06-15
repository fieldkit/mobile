import axios from "axios";
import { ServicesImpl } from "@/services";
import { LoginAction } from "@/store";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Authentication", () => {
    let services;

    beforeEach(() => {
        services = new ServicesImpl();
        return services.CreateDb().initialize();
    });

    afterEach(() => {
        mockedAxios.request.mockReset();
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
                status: 200,
                data: {
                    id: 2,
                    email: "jacob@conservify.org",
                },
            };

            const firmware = {
                status: 200,
                data: {
                    firmwares: [
                        {
                            id: 1000,
                            time: new Date(),
                            url: "url",
                            module: "module",
                            profile: "profile",
                            etag: "etag",
                            meta: "{}",
                            buildTime: 0,
                            buildNumber: 100,
                        },
                    ],
                },
            };

            const status = {
                status: 200,
                data: {},
            };

            const transmission = {
                status: 200,
                data: {
                    token: "token",
                    url: "url",
                },
            };

            mockedAxios.request
                .mockReturnValueOnce(Promise.resolve(auth))
                .mockReturnValueOnce(Promise.resolve(user))
                .mockReturnValueOnce(Promise.resolve(transmission))
                .mockReturnValueOnce(Promise.resolve(status))
                .mockReturnValueOnce(Promise.resolve(firmware))
                .mockReturnValueOnce(Promise.resolve(firmware));

            services.Conservify().download = jest.fn(() =>
                Promise.resolve({
                    statusCode: 200,
                })
            );

            expect.assertions(1);

            return services
                .Store()
                .dispatch(new LoginAction("jacob@conservify.org", "password"))
                .then(() => {
                    expect(true).toBe(true);
                });
        });
    });
});
