import axios from "axios";
import * as MutationTypes from "../store/mutations";
import { Services } from "../services/services";
import Fixtures from "./fixtures.js";

jest.mock("axios");

describe("UserAuth", () => {
    let services;
    let portalInterface;

    beforeEach(async () => {
        services = new Services();
        portalInterface = services.PortalInterface();
        services.Store().commit(MutationTypes.SERVICES, () => services);
        await services.CreateDb().initialize();
        await new Fixtures(services.Database()).addMinimum();
    });

    afterEach(() => {
        axios.mockReset();
    });

    it("should not have a user logged in by default", () => {
        expect(portalInterface.isLoggedIn()).toBeFalsy();
    });

    it("should log user in", () => {
        const accessToken = "Bearer 34234324234";
        const user = {
            name: "realuser",
            email: "realuser@user.com",
            password: "realuserspassword",
        };
        const mockResponseLogin = {
            status: 204,
            headers: { authorization: accessToken },
        };
        const mockResponseCurrentUser = {
            status: 200,
            headers: { authorization: accessToken },
            data: {
                name: "Somebody Real",
            },
        };
        axios
            .mockImplementationOnce(() => Promise.resolve(mockResponseLogin))
            .mockImplementationOnce(() => Promise.resolve(mockResponseCurrentUser));
        return portalInterface.login(user).then((resp) => expect(portalInterface.isLoggedIn()).toBeTruthy());
    });

    it("should not log non-existing user in", () => {
        const user = {
            name: "fakeuser",
            email: "fakeuser@user.com",
            password: "fakeuserspassword",
        };
        const mockResponse = {
            status: 400,
            headers: { null: "HTTP/1.1 400 Bad Request" },
        };
        axios.mockImplementation(() => Promise.resolve(mockResponse));
        const expectedError = new Error("authentication failed");
        return portalInterface.login(user).catch((error) => {
            expect(error).toEqual(expectedError);
        });
    });

    it("should register new user", () => {
        const user = {
            name: "newuser",
            email: "newuser@user.com",
            password: "newuserspassword",
        };
        const mockResponse = { status: 200 };
        axios.mockImplementation(() => Promise.resolve(mockResponse));
        return portalInterface.register(user).then((resp) => expect(resp).toEqual("Account created"));
    });
});
