import _ from "lodash";

export interface SimpleScreen {
    body: string;
    images: { url: string }[];
    logo?: { url: string } | null | undefined;
}

export interface Header {
    title: string;
    subtitle: string | null;
}

export interface Screen {
    name: string;
    locale: string;
    forward: string;
    skip: string | null;
    guideTitle: string | null;
    guideUrl: string | null;
    header: Header | null;
    simple: SimpleScreen[];
}

export interface Flow {
    id: string;
    name: string;
    showProgress: boolean;
}

export interface FlowFile {
    data: {
        flows: Flow[];
        screens: Screen[];
    };
}

export class NavigationProps {
    constructor(public readonly name: string, public readonly index: number = 0) {}
}

export class NavigationOption {
    private constructor(public readonly label: string | null, public readonly navigateBack: boolean = false) {}

    public get allowed(): boolean {
        return this != NavigationOption.Nope;
    }

    public static Nope = new NavigationOption("nope");
    public static Done = new NavigationOption("done");
    public static Forward = new NavigationOption("forward");
    public static Skip = new NavigationOption("skip");

    public static allowed(label: string): NavigationOption {
        return new NavigationOption(label);
    }
}

export class NavigationOptions {
    constructor(public readonly backward: NavigationOption, public readonly forward: NavigationOption) {}
}

export class VisibleScreen {
    constructor(public readonly screen: Screen, public readonly navOptions: NavigationOptions) {}

    public get name(): string {
        return this.screen.name;
    }

    public get forward(): string {
        return this.screen.forward;
    }

    public get skip(): string | null {
        return this.screen.skip;
    }

    public get header(): Header | null {
        return this.screen.header;
    }

    public get simple(): SimpleScreen[] {
        return this.screen.simple;
    }

    public get guide(): { url: string | null; title: string | null } {
        if (this.screen.guideTitle && this.screen.guideUrl) {
            return {
                title: this.screen.guideTitle,
                url: this.screen.guideUrl,
            };
        }
        return {
            title: null,
            url: null,
        };
    }
}

function screenOrder(screen: Screen): number {
    return Number(screen.name.replace(/[a-z.]+/, ""));
}

function getFlowForScreen(name: string): string {
    return name.replace(/\.\d+$/, "");
}

export function getFlowNames(flowFile: FlowFile): string[] {
    const screenNames = flowFile.data.screens.map((s) => s.name);
    const flowsFromScreens = screenNames.map((name) => getFlowForScreen(name));
    return _.uniq(flowsFromScreens);
}

export class FlowNavigator {
    public readonly flow: Flow;
    private readonly name: string;
    private readonly screens: Screen[];
    private readonly visible: VisibleScreen;
    private readonly index: number;

    static None = new FlowNavigator({ data: { flows: [], screens: [] } }, new NavigationProps(""));

    public get ready(): boolean {
        return this.screens.length > 0;
    }

    public get progress(): number {
        return (this.index / (this.screens.length - 1)) * 100.0;
    }

    public get key(): string {
        return `key-${this.index}`;
    }

    constructor(data: FlowFile, props: NavigationProps) {
        const byKey = _.keyBy(data.data.flows, (f) => f.name);
        this.name = props.name;
        this.index = props.index || 0;
        if (!byKey[this.name]) {
            this.flow = {
                id: "virtual",
                name: this.name,
                showProgress: true,
            };
        }
        this.flow = byKey[this.name];
        this.screens = data.data.screens.filter((screen) => getFlowForScreen(screen.name) == this.name);
        this.screens.sort((a, b) => {
            return screenOrder(a) - screenOrder(b);
        });
        this.visible = this.createVisibleScreen();
    }

    private createVisibleScreen(): VisibleScreen {
        const screen = this.screens[this.index];
        const forward = this.index == this.screens.length - 1 ? NavigationOption.Done : NavigationOption.Forward;
        const backward = NavigationOption.Nope;
        const navOptions = new NavigationOptions(backward, forward);
        return new VisibleScreen(screen, navOptions);
    }

    public move(option: NavigationOption): Promise<NavigationProps | null> {
        switch (option) {
            case NavigationOption.Nope:
                throw new Error(`invalid navigation: Nope`);
            case NavigationOption.Done: {
                return Promise.resolve(null);
            }
            case NavigationOption.Skip: {
                return Promise.resolve(null);
            }
            case NavigationOption.Forward: {
                if (this.index == this.screens.length - 1) throw new Error("invalid nav forward");
                return Promise.resolve(new NavigationProps(this.name, this.index + 1));
            }
        }

        throw new Error(`invalid navigation: ${JSON.stringify(option)}`);
    }

    public get screen(): VisibleScreen {
        return this.visible;
    }
}
