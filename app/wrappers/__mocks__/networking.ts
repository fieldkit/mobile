import { TransferInfo, HttpResponse } from "nativescript-conservify";

export default class Conservify {
    public protobuf(_info: TransferInfo): Promise<HttpResponse> {
        return new Promise((resolve, _reject) => {
            resolve({} as HttpResponse);
        });
    }

    public json(_info: TransferInfo): Promise<HttpResponse> {
        return new Promise((resolve, _reject) => {
            resolve({} as HttpResponse);
        });
    }
}
