import { Database } from "@/wrappers/sqlite";

export default class Migration {
    public up(db:Database): Promise<void> {
		return Promise.resolve();
	}

    public down(db:Database): Promise<void> {
		return Promise.resolve();
    }
}
