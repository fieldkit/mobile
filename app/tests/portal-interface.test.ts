import axios from "axios";
import { OurStore, PortalInterface, Services, ServicesImpl } from "@/services";
import { LoginAction } from "@/store";
import Fixtures from "./fixtures.js";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("UserAuth", () => {
    let services: Services;
    let store: OurStore;
    let portalInterface: PortalInterface;

    beforeEach(async () => {
        services = new ServicesImpl();
        portalInterface = services.PortalInterface();
        store = services.Store();
        await services.CreateDb().initialize(null, false, false);
        await new Fixtures(services.Database()).addMinimum();
    });

    afterEach(() => {
        mockedAxios.request.mockReset();
    });

    it("should be unauthenticated by defeault", () => {
        expect(portalInterface.isLoggedIn()).toBeFalsy();
    });

    it("should log user in", async () => {
        const accessToken = "Bearer 34234324234";
        const user = {
            email: "realuser@user.com",
            password: "realuserspassword",
        };
        const loginResponse = {
            status: 204,
            headers: { authorization: accessToken },
        };
        const userResponse = {
            status: 200,
            headers: { authorization: accessToken },
            data: {
                id: 2,
                email: "jacob@conservify.org",
            },
        };
        const statusResponse = {
            status: 200,
            data: {},
        };
        const transmissionResponse = {
            status: 200,
            data: {
                token: "token",
                url: "url",
            },
        };
        const firmwareResponse = {
            status: 200,
            data: {
                firmwares: [],
            },
        };

        mockedAxios.request
            .mockReturnValueOnce(Promise.resolve(loginResponse))
            .mockReturnValueOnce(Promise.resolve(userResponse))
            .mockReturnValueOnce(Promise.resolve(transmissionResponse))
            .mockReturnValueOnce(Promise.resolve(statusResponse))
            .mockReturnValueOnce(Promise.resolve(firmwareResponse))
            .mockReturnValueOnce(Promise.resolve(firmwareResponse));

        await store.dispatch(new LoginAction(user.email, user.password));

        expect(portalInterface.isLoggedIn()).toBeTruthy();
    });

    it("should be unauthenticated after failed login", async () => {
        const user = {
            email: "fakeuser@example.com",
            password: "fakeuserspassword",
        };
        const mockResponse = {
            status: 400,
            headers: { null: "HTTP/1.1 400 Bad Request" },
        };
        mockedAxios.request.mockReturnValueOnce(Promise.resolve(mockResponse));
        const expectedError = new Error("authentication failed");
        await store.dispatch(new LoginAction(user.email, user.password)).catch((error) => {
            expect(error).toEqual(expectedError);
        });
    });

    it("should register new user", async () => {
        const user = {
            name: "Carla",
            email: "carla@example.com",
            password: "newuserspassword",
        };
        const mockResponse = { status: 200 };
        mockedAxios.request.mockReturnValueOnce(Promise.resolve(mockResponse));

        const resp = await portalInterface.register(user);
        expect(resp).toBeUndefined();
    });
});
