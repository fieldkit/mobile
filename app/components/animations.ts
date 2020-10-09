import { promiseAfter } from "../utilities";

export function pressed(view: any): Promise<void> {
    if (view) {
        const cn = view.className;
        view.className = cn + " pressed";
        return promiseAfter(500).then(() => (view.className = cn));
    }
    return Promise.resolve();
}
