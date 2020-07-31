export class ImageAsset {
    constructor() {}
}

export class ImageSource {
    constructor() {}
}

export class IncomingImage {
    constructor(public readonly asset: ImageAsset) {}
}

export class SavedImage {
    constructor(public readonly path: string, public readonly source: ImageSource | null, public readonly asset: ImageAsset | null) {}
}
