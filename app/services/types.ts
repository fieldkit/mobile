export class IncomingImage {
    constructor(public readonly source: any) {}
}

export class SavedImage {
    constructor(public readonly path: string, public readonly source: any | null) {}
}
