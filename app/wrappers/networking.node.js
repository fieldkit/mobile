export default class Conservify {
	constructor() {
	}

	protobuf(info) {
		return new Promise((resolve, reject) => {
			resolve({
				body: {
					status: {
					},
					liveReadings: {
					},
					modules: {
					}
				}
			});
		});
	}
}
