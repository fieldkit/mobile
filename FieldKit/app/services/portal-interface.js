import axios from "axios";
import Config from "../config";
import Networking from "../wrappers/networking";
import AppSettings from "../wrappers/app-settings";

let currentUser = {};
const appSettings = new AppSettings();

export default class PortalInterface {
	constructor() {
		this.networking = new Networking("fk-image-upload");
	}

    storeCurrentUser() {
        let portalInterface = this;

        return axios({
            method: "GET",
            url: Config.baseUri + "/user",
            headers: {
                "Content-Type": "application/json",
                Authorization: appSettings.getString("accessToken")
            }
        })
            .then(handleResponse)
            .catch(this._handleError);

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
        return appSettings.getString("accessToken") ? true : false;
    }

    getCurrentToken() {
        return appSettings.getString("accessToken");
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
            .catch(this._handleError);

        function handleResponse(response) {
            if (response.status == "204") {
                // success
                const accessToken = response.headers.authorization
                    ? response.headers.authorization
                    : response.headers.Authorization;
                appSettings.setString("accessToken", accessToken);
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
                Authorization: appSettings.getString("accessToken")
            }
        })
            .then(handleResponse)
            .catch(this._handleError);

        function handleResponse(response) {
            if (response.status == "204") {
                appSettings.remove("accessToken")
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
            .catch(this._handleError);

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
                Authorization: appSettings.getString("accessToken")
            },
            data: data
        })
            .then(handleResponse)
            .catch(this._handleError);

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
                Authorization: appSettings.getString("accessToken")
            },
            data: data
        })
            .then(handleResponse)
            .catch(this._handleError);

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
                Authorization: appSettings.getString("accessToken")
            }
        })
            .then(this._handleResponse.bind(this))
            .catch(this._handleError.bind(this));
    }

    getStationById(id) {
        return axios({
            url: Config.baseUri + "/stations/@/" + id,
            headers: {
                "Content-Type": "application/json",
                Authorization: appSettings.getString("accessToken")
            }
        })
            .then(this._handleResponse.bind(this))
            .catch(this._handleError.bind(this));
    }

    addFieldNote(data) {
        return axios({
            method: "POST",
            url: Config.baseUri + "/stations/" + data.stationId + "/field-notes",
            headers: {
                "Content-Type": "application/json",
                Authorization: appSettings.getString("accessToken")
            },
            data: data
        })
            .then(this._handleResponse.bind(this))
            .catch(this._handleError.bind(this));
    }

    addFieldNoteMedia(data) {
        return new Promise((resolve, reject) => {
            const headers = {
                Authorization: appSettings.getString("accessToken")
            };
            const req = {
                url: Config.baseUri + "/stations/" + data.stationId + "/field-note-media",
                method: "POST",
                headers: { ...headers }
            };
            const task = this.networking.uploadFile(data.pathDest, req);
            task.on("progress", e => {
                const rv = {
                    progress: 100.0 * (e.currentBytes / e.totalBytes),
                    currentBytes: e.currentBytes,
                    totalBytes: e.totalBytes
                };
                if(rv.progress == 100) {
                    resolve(rv);
                }
            });
            task.on("responded", e => {
                const rv = {
                    data: e.data,
                    status: e.responseCode
                };
                resolve(rv);
            });
            task.on("error", e => {
                reject(e.error);
            });
        });
    }

    _handleResponse(response) {
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error("Query failed");
        }
    }

    _handleError(error) {
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
}
