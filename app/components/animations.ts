import { promiseAfter } from "../utilities";

export function pressed(view: { className: string }): Promise<void> {
    if (view) {
        const cn = view.className;
        view.className = cn + " pressed";
        return promiseAfter(500)
            .then(() => (view.className = cn))
            .then(() => {
                return;
            });
    }
    return Promise.resolve();
}
