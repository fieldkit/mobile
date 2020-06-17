import { Coordinates, Phone, KnownStations } from "../services/known-stations";
import DomainServices from "../services/domain-services";

describe("Known Stations (Locations)", () => {
	let phone;
	let knownStations;
	let data = {
		deviceId: "my-fake-device-id",
		connected: true,
	};

	beforeEach(() => {
		DomainServices().updateStation = jest.fn(() => {
			return Promise.resolve();
		});
	});

	beforeEach(() => {
		phone = new Phone();
		knownStations = new KnownStations();
	});

	describe("haveNewStatus with connected station", () => {
		it("with valid station location, should use station location", () => {
			expect.assertions(3);

			const status = {
				gps: {
					latitude: 38,
					longitude: -118,
				},
			};
			return knownStations
				.get(data)
				.haveNewStatus(status, phone)
				.then(_ => {
					expect(DomainServices().updateStation.mock.calls.length).toBe(1);
					const actual = DomainServices().updateStation.mock.calls[0][0];
					expect(actual.data.latitude).toBe(38);
					expect(actual.data.longitude).toBe(-118);
				});
		});

		it("with valid station and phone location, should use station location", () => {
			expect.assertions(3);

			phone.location = new Coordinates(-10, 10);

			const status = {
				gps: {
					latitude: 38,
					longitude: -118,
				},
			};

			return knownStations
				.get(data)
				.haveNewStatus(status, phone)
				.then(_ => {
					expect(DomainServices().updateStation.mock.calls.length).toBe(1);
					const actual = DomainServices().updateStation.mock.calls[0][0];
					expect(actual.data.latitude).toBe(38);
					expect(actual.data.longitude).toBe(-118);
				});
		});

		it("with invalid station and phone location, should update nothing", () => {
			expect.assertions(1);

			const status = {
				gps: {
					latitude: 1000,
					longitude: 1000,
				},
			};
			return knownStations
				.get(data)
				.haveNewStatus(status, phone)
				.then(_ => {
					expect(DomainServices().updateStation.mock.calls.length).toBe(0);
				});
		});

		it("with valid phone location, should use phone location", () => {
			expect.assertions(3);

			phone.location = new Coordinates(-10, 10);

			const status = {
				gps: {
					latitude: 1000,
					longitude: 1000,
				},
			};
			return knownStations
				.get(data)
				.haveNewStatus(status, phone)
				.then(_ => {
					expect(DomainServices().updateStation.mock.calls.length).toBe(1);
					const actual = DomainServices().updateStation.mock.calls[0][0];
					expect(actual.data.latitude).toBe(-10);
					expect(actual.data.longitude).toBe(10);
				});
		});
	});

	describe("haveNewPhonelocation", () => {
		it("with invalid phone location, should do nothing", () => {
			expect.assertions(1);

			return knownStations
				.get(data)
				.haveNewPhoneLocation(phone)
				.then(_ => {
					expect(DomainServices().updateStation.mock.calls.length).toBe(0);
				});
		});

		it("with valid phone location and invalid station location, should use phone location", () => {
			expect.assertions(3);

			phone.location = new Coordinates(-10, 10);

			return knownStations
				.get(data)
				.haveNewPhoneLocation(phone)
				.then(_ => {
					expect(DomainServices().updateStation.mock.calls.length).toBe(1);
					const actual = DomainServices().updateStation.mock.calls[0][0];
					expect(actual.data.latitude).toBe(-10);
					expect(actual.data.longitude).toBe(10);
				});
		});

		it("with valid phone location and valid station location, should ignore phone location", () => {
			expect.assertions(2);

			phone.location = new Coordinates(-10, 10);

			data.latitude = 34;
			data.longitude = -118;

			const status = {
				gps: {
					latitude: 34,
					longitude: -118,
				},
			};

			return knownStations
				.get(data)
				.haveNewStatus(status, phone)
				.then(_ => {
					expect(DomainServices().updateStation.mock.calls.length).toBe(1);
					return knownStations
						.get(data)
						.haveNewPhoneLocation(phone)
						.then(_ => {
							expect(DomainServices().updateStation.mock.calls.length).toBe(1);
						});
				});
		});
	});
});
