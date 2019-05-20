import axios from 'axios';
import Config from "../config";

var accessToken = null;

export default class UserAuth {

    isLoggedIn() {
        return accessToken;
    }

    login(user) {
        return axios({
                method: 'POST',
                url: Config.baseUri+"/login",
                headers: { "Content-Type": "application/json" },
                data: {
                    username: user.email,
                    email: user.email,
                    password: user.password,
                }
            })
            .then(handleResponse)
            .catch(handleError)

        function handleResponse(response){
            if(response.status == "204") {
                // success
                accessToken = response.headers.Authorization;
                return
            } else {
                throw new Error("Log in failed")
            }
        }

        function handleError(error){
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                var details = error.response.data.detail.split("; ");
                // do not display their password!
                var cleaned = details.map(function(d) {
                    if(d.indexOf("length of request.password") == 0) {
                        d = "Password length must be greater than or equal to 10."
                    }
                    return d;
                });
                throw new Error(cleaned.join("\n\n"));
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser
                // and an instance of http.ClientRequest in node.js
                // console.log("error.request", error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                // console.log('error.message', error.message);
            }
            // console.log(error.config);

            throw error;
        }
    }

    logout() {
        return axios({
                method: 'POST',
                url: Config.baseUri+"/logout",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": accessToken,
                },
            })
            .then(handleResponse)
            .catch(handleError)

        function handleResponse(response){
            if(response.status == "204") {
                accessToken = null;
                return
            } else {
                throw new Error(response);
            }
        }

        function handleError(error){
            throw error;
        }
    }

    register(user) {
        return axios({
                method: 'POST',
                url: Config.baseUri+"/users",
                headers: { "Content-Type": "application/json" },
                data: {
                    // temp
                    "bio": "blank bio",
                    "invite_token": "XQaQVxNJRANDjNUKYXLpjQ",
                    // end temp
                    "name": user.name,
                    "email": user.email,
                    "username": user.email,
                    "password": user.password,
                }
            })
            .then(handleResponse)
            .catch(handleError)

        function handleResponse(response){
            if(response.status == "200") {
                return "Account created"
            } else {
                throw new Error("Account not created");
            }
        }

        function handleError(error){
            // this request doesn't display error responses to user
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
                // console.log('error.message', error.message);
            }
            // console.log(error.config);

            throw error;
        }
    }

    resetPassword(email) {
    }
}

