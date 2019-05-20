import axios from "axios";
import UserAuth from "../services/user-auth";
const userAuth = new UserAuth();

jest.mock("axios");

afterEach(() => {
  axios.mockReset();
});

test("should not have a user logged in by default", () => {
    expect(userAuth.isLoggedIn()).toBe(null);
});

test("should log user in", () => {
    const accessToken = "Bearer 34234324234";
    const user = {name: "realuser", email: "realuser@user.com", password: "realuserspassword"};
    const mockResponse = {status: "204", headers: {Authorization: accessToken}};
    axios.mockImplementation(() => Promise.resolve(mockResponse));
    return userAuth.login(user).then(resp => expect(userAuth.isLoggedIn()).toEqual(accessToken));
});

test("should not log non-existing user in", () => {
    const user = {name: "fakeuser", email: "fakeuser@user.com", password: "fakeuserspassword"};
    const mockResponse = {status: "400", headers: {null: 'HTTP/1.1 400 Bad Request'}};
    axios.mockImplementation(() => Promise.resolve(mockResponse));
    const expectedError = new Error("Log in failed");
    return userAuth.login(user).catch(error => {expect(error).toEqual(expectedError)});
});

test("should log user out", () => {
    const headers = {headers: {Authorization: "Bearer 34234324234"}};
    const mockResponse = {status: "204"};
    axios.mockImplementation(() => Promise.resolve(mockResponse));
    return userAuth.logout().then(resp => expect(userAuth.isLoggedIn()).toBe(null));
});

test("should register new user", () => {
    const user = {name: "newuser", email: "newuser@user.com", password: "newuserspassword"};
    const mockResponse = {status: "200"};
    axios.mockImplementation(() => Promise.resolve(mockResponse));
    return userAuth.register(user).then(resp => expect(resp).toEqual("Account created"));
});
