// import { promiseAfter } from "../utilities";

export function pressed(view: Event | null): Promise<void> {
    if (view) {
        /*
        const cn = view.className;
        view.className = cn + " pressed";
        return promiseAfter(500)
            .then(() => (view.className = cn))
            .then(() => {
                return;
            });
		*/
    }
    return Promise.resolve();
}
