import axios from "axios";
import { Services } from "../services/services";

describe("Authentication", () => {
	let services;

	beforeEach(() => {
		services = new Services();
	});

	afterEach(() => {
		axios.mockReset();
	});

	describe("login", () => {
		it("should download firmware after login", () => {
			const auth = {
				status: 204,
				headers: {
					Authoriation: 'TOKEN',
				},
				data: {
				}
			};

			const user = {
				data: {
					name: 'Jacob'
				}
			};

			const firmware = {
				data: {
					firmwares: [{
						id: 1000
					}]
				}
			};

			axios
				.mockReturnValueOnce(Promise.resolve(auth))
				.mockReturnValueOnce(Promise.resolve(user))
				.mockReturnValueOnce(Promise.resolve(firmware));

			services.Conservify().download = jest.fn(() => Promise.resolve({
				status: 200
			}));

			expect.assertions(1);

			return services.PortalSession().login({
				email: 'jacob@conservify.org',
				password: 'password'
			}).then(() => {
				expect(services.Conservify().download.mock.calls.length).toBe(1);
			});
		});
	});
});
