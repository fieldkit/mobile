import axios from "axios";
import PortalInterface from "../services/portal-interface";

describe("Authentication", () => {
	let portal;

	beforeEach(() => {
		portal = new PortalInterface();
	});

	afterEach(() => {
		axios.mockReset();
	});

	describe("login", () => {
		it("should download firmware after login", () => {
			console.log("HI");

			const mockResponse = {
				status: 200,
				data: {
				}
			};

			axios.mockImplementation(() => Promise.resolve(mockResponse));

			return portal.login({
				email: 'jacob@conservify.org',
				password: 'password'
			});
		});
	});
});
