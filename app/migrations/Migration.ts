import { Database } from "@/wrappers/sqlite";

export default class Migration {
    public up(_db: Database): Promise<void> {
        return Promise.resolve();
    }

    public down(_db: Database): Promise<void> {
        return Promise.resolve();
    }
}
