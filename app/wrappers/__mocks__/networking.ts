export default class Conservify {
    public protobuf(info): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve({
                body: {
                    status: {},
                    liveReadings: {},
                    modules: {},
                },
            });
        });
    }
}
