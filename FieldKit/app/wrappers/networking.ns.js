import * as BackgroundHttp from "nativescript-background-http";

export default class NetworkingNativeScript {
	constructor(sessionName) {
		this.session = BackgroundHttp.session(sessionName);
	}

	uploadFile(path, req) {
		return this.session.uploadFile(path, req);
	}
}
