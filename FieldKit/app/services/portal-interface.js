import axios from "axios";
import Config from "../config";

let accessToken = null;
let currentUser = {};

export default class PortalInterface {
    handleError(error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            // console.log("error.response", error.response);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser
            // and an instance of http.ClientRequest in node.js
            // console.log("error.request", error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            // console.log("error.message", error.message);
        }
        // console.log(error.config);

        throw error;
    }

    storeCurrentUser() {
        let portalInterface = this;

        return axios({
            method: "GET",
            url: Config.baseUri + "/user",
            headers: {
                "Content-Type": "application/json",
                Authorization: accessToken
            }
        })
            .then(handleResponse)
            .catch(this.handleError);

        function handleResponse(response) {
            if (response.status == "200") {
                currentUser.name = response.data.name;
                currentUser.portalId = response.data.id;
                return response.data;
            } else {
                throw new Error(response);
            }
        }
    }

    getCurrentUser() {
        return currentUser;
    }

    isLoggedIn() {
        return accessToken ? true : false;
    }

    getCurrentToken() {
        return accessToken;
    }

    login(user) {
        let portalInterface = this;

        return axios({
            method: "POST",
            url: Config.baseUri + "/login",
            headers: { "Content-Type": "application/json" },
            data: {
                email: user.email,
                password: user.password
            }
        })
            .then(handleResponse)
            .catch(this.handleError);

        function handleResponse(response) {
            if (response.status == "204") {
                // success
                accessToken = response.headers.authorization
                    ? response.headers.authorization
                    : response.headers.Authorization;
                portalInterface.storeCurrentUser();
                return;
            } else {
                throw new Error("Log in failed");
            }
        }
    }

    logout() {
        return axios({
            method: "POST",
            url: Config.baseUri + "/logout",
            headers: {
                "Content-Type": "application/json",
                Authorization: accessToken
            }
        })
            .then(handleResponse)
            .catch(this.handleError);

        function handleResponse(response) {
            if (response.status == "204") {
                accessToken = null;
                return;
            } else {
                throw new Error(response);
            }
        }
    }

    register(user) {
        return axios({
            method: "POST",
            url: Config.baseUri + "/users",
            headers: { "Content-Type": "application/json" },
            data: {
                name: user.name,
                email: user.email,
                password: user.password
            }
        })
            .then(handleResponse)
            .catch(this.handleError);

        function handleResponse(response) {
            if (response.status == "200") {
                return "Account created";
            } else {
                throw new Error("Account not created");
            }
        }
    }

    resetPassword(email) {}

    addStation(data) {
        return axios({
            method: "POST",
            url: Config.baseUri + "/stations",
            headers: {
                "Content-Type": "application/json",
                Authorization: accessToken
            },
            data: data
        }).then(handleResponse).catch(this.handleError);

        function handleResponse(response) {
            if (response.status == "200") {
                return response.data.id;
            } else {
                throw new Error("Station not added");
            }
        }
    }

    updateStation(data, portalId) {
        return axios({
            method: "PATCH",
            url: Config.baseUri + "/stations/" + portalId,
            headers: {
                "Content-Type": "application/json",
                Authorization: accessToken
            },
            data: data
        }).then(handleResponse).catch(this.handleError);

        function handleResponse(response) {
            if (response.status == "200") {
                return response.data.id;
            } else {
                throw new Error("Station not updated");
            }
        }
    }

    getStationSyncState(deviceId) {
        return axios({
            url: Config.baseUri + "/data/devices/" + deviceId + "/summary",
            headers: {
                "Content-Type": "application/json",
                "Authorization": accessToken
            },
        }).then(this._handleResponse.bind(this)).catch(this.handleError.bind(this));
    }

    getStationById(id) {
        return axios({
            url: Config.baseUri + "/stations/@/" + id,
            headers: {
                "Content-Type": "application/json",
                "Authorization": accessToken
            },
        }).then(this._handleResponse.bind(this)).catch(this.handleError.bind(this));
    }

    _handleResponse(response) {
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error("Query failed");
        }
    }
}
