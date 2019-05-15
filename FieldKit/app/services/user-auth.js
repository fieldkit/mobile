const http = require("tns-core-modules/http");
import Config from "../config";

var ACCESS_TOKEN = null;

export default class UserAuth {

    isLoggedIn() {
        return ACCESS_TOKEN;
    }

    login(user) {
        return http.request({
                url: Config.baseUri+"/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                content: JSON.stringify({
                    username: user.email,
                    email: user.email,
                    password: user.password
                })
            })
            .then(handleResponse)
            .catch(handleError)

        function handleResponse(response){
            if(response.statusCode == "204") {
                // success
                ACCESS_TOKEN = response.headers.Authorization;
                return
            } else {
                var content = response.content.toJSON();
                var details = content.detail.split("; ");
                // do not display their password!
                var cleaned = details.map(function(d) {
                    if(d.indexOf("length of request.password") == 0) {
                        d = "Password length must be greater than or equal to 10."
                    }
                    return d;
                });
                throw new Error(cleaned.join("\n\n"));
            }
        }

        function handleError(error){
            throw error;
        }
    }

    logout() {
        return http.request({
                url: Config.baseUri+"/logout",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": ACCESS_TOKEN,
                 }
            })
            .then(handleResponse)
            .catch(handleError)

        function handleResponse(response){
            if(response.statusCode == "204") {
                ACCESS_TOKEN = null;
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
        return http.request({
                url: Config.baseUri+"/users",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                content: JSON.stringify({
                    // temp
                    "bio": "blank bio",
                    "invite_token": "XQaQVxNJRANDjNUKYXLpjQ",
                    // end temp
                    "name": user.name,
                    "email": user.email,
                    "username": user.email,
                    "password": user.password,
                })
            })
            .then(handleResponse)
            .catch(handleError)

        function handleResponse(response){
            if(response.statusCode == "200") {
                return
            } else {
                throw new Error(response);
            }
        }

        function handleError(error){
            throw error;
        }
    }

    resetPassword(email) {
    }
}

