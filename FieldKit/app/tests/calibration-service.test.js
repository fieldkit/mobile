import Services from "../services/services";
import { MockStationReplies } from './utilities'
import protobuf from "protobufjs";

const atlasRoot = protobuf.Root.fromJSON(require("fk-atlas-protocol"));
const ReplyType = atlasRoot.lookup("fk_atlas.ReplyType");
const SensorType = atlasRoot.lookup("fk_atlas.SensorType");
const PhCalibrations = atlasRoot.lookup("fk_atlas.PhCalibrations");
const DoCalibrations = atlasRoot.lookup("fk_atlas.DoCalibrations");
const EcCalibrations = atlasRoot.lookup("fk_atlas.EcCalibrations");

describe('Calibration', () => {
    let calibrationService
    let mockStation

    beforeEach(() => {
        calibrationService = Services.CalibrationService()
        mockStation = new MockStationReplies(Services)
    })

    it('Should get calibration status from Atlas module', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_PH,
                time: Date.now(),
                ph: PhCalibrations.values.PH_LOW
            },
        })

        return calibrationService.getCalibrationStatus().then(body => {
            expect(body.calibration.ph).toBeDefined()
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })

    it('Should clear calibration status for Atlas module', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_PH,
                time: Date.now(),
                ph: PhCalibrations.values.PH_NONE
            },
        });

        return calibrationService.clearCalibration().then(body => {
            expect(body.calibration.ph).toBe(PhCalibrations.values.PH_NONE)
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })

    it('Should perform low point calibration for Atlas pH sensor', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_PH,
                time: Date.now(),
                ph: PhCalibrations.values.PH_LOW
            },
        });

        const address = "http://192.168.1.8:80/fk/v1/module/1";
        const data = {
            refValue: 0
        };
        return calibrationService.calibrateLowPh(address, data).then(body => {
            expect(body.calibration.phStatus.low).toBeGreaterThan(PhCalibrations.values.PH_NONE)
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })

    it('Should perform middle point calibration for Atlas pH sensor', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_PH,
                time: Date.now(),
                ph: PhCalibrations.values.PH_MIDDLE
            },
        });

        const address = "http://192.168.1.8:80/fk/v1/module/1";
        const data = {
            refValue: 7
        };
        return calibrationService.calibrateMidPh(address, data).then(body => {
            expect(body.calibration.phStatus.middle).toBeGreaterThan(PhCalibrations.values.PH_NONE)
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })

    it('Should perform high point calibration for Atlas pH sensor', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_PH,
                time: Date.now(),
                ph: PhCalibrations.values.PH_HIGH
            },
        });

        const address = "http://192.168.1.8:80/fk/v1/module/1";
        const data = {
            refValue: 14
        };
        return calibrationService.calibrateMidPh(address, data).then(body => {
            expect(body.calibration.phStatus.high).toBeGreaterThan(PhCalibrations.values.PH_NONE)
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })

    it('Should perform dry calibration for Atlas conductivity sensor', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_EC,
                time: Date.now(),
                ec: EcCalibrations.values.EC_DRY
            },
        });

        const address = "http://192.168.1.8:80/fk/v1/module/1";
        const data = {
            refValue: 10
        };
        return calibrationService.calibrateDryConductivity(address, data).then(body => {
            expect(body.calibration.ec).toBeGreaterThan(EcCalibrations.values.EC_NONE)
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })

    it('Should perform single calibration for Atlas conductivity sensor', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_EC,
                time: Date.now(),
                ec: EcCalibrations.values.EC_SINGLE
            },
        });

        const address = "http://192.168.1.8:80/fk/v1/module/1";
        const data = {
            refValue: 10
        };
        return calibrationService.calibrateSingleConductivity(address, data).then(body => {
            expect(body.calibration.ec).toBeGreaterThan(EcCalibrations.values.EC_NONE)
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })

    it('Should perform dual low calibration for Atlas conductivity sensor', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_EC,
                time: Date.now(),
                ec: EcCalibrations.values.EC_DUAL_LOW
            },
        });

        const address = "http://192.168.1.8:80/fk/v1/module/1";
        const data = {
            refValue: 10
        };
        return calibrationService.calibrateDualLowConductivity(address, data).then(body => {
            expect(body.calibration.ec).toBeGreaterThan(EcCalibrations.values.EC_NONE)
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })

    it('Should perform dual high calibration for Atlas conductivity sensor', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_EC,
                time: Date.now(),
                ec: EcCalibrations.values.EC_DUAL_HIGH
            },
        });

        const address = "http://192.168.1.8:80/fk/v1/module/1";
        const data = {
            refValue: 10
        };
        return calibrationService.calibrateDualHighConductivity(address, data).then(body => {
            expect(body.calibration.ec).toBeGreaterThan(EcCalibrations.values.EC_NONE)
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })

    it('Should perform atmosphere calibration for Atlas dissolved oxygen sensor', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_DO,
                time: Date.now(),
                dissolvedOxygen: DoCalibrations.values.DO_ATMOSPHERE
            },
        });

        const address = "http://192.168.1.8:80/fk/v1/module/1";
        const data = {
            refValue: 10
        };
        return calibrationService.calibrateAtmosphereDissolvedOxygen(address, data).then(body => {
            expect(body.calibration.dissolvedOxygen).toBeGreaterThan(DoCalibrations.values.DO_NONE)
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })

    it('Should perform zero calibration for Atlas dissolved oxygen sensor', () => {
        expect.assertions(2)

        mockStation.queueAtlasBody({
            type: ReplyType.values.REPLY_ATLAS_COMMAND,
            errors: [],
            calibration: {
                type: SensorType.values.SENSOR_DO,
                time: Date.now(),
                dissolvedOxygen: DoCalibrations.values.DO_ZERO
            },
        });

        const address = "http://192.168.1.8:80/fk/v1/module/1";
        const data = {
            refValue: 1
        };
        return calibrationService.calibrateZeroDissolvedOxygen(address, data).then(body => {
            expect(body.calibration.dissolvedOxygen).toBeGreaterThan(DoCalibrations.values.DO_NONE)
            expect(mockStation.mock.calls.length).toBe(1)
        });
    })
})
