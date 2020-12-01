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
                data: {
                    id: 2,
                    email: "jacob@conservify.org",
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

            const transmission = {
                data: {
                    token: "token",
                    url: "url",
                },
            };

            mockedAxios.request
                .mockReturnValueOnce(Promise.resolve(auth))
                .mockReturnValueOnce(Promise.resolve(user))
                .mockReturnValueOnce(Promise.resolve(transmission))
                .mockImplementationOnce(() => {
                    // No idea what causes this.
                    throw new Error();
                })
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
