import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddGenerationToStream_20201105_151735 extends Migration {
    public async up(db: Database): Promise<void> {
        await db.batch([
            `DROP INDEX streams_idx`,
            `ALTER TABLE streams ADD COLUMN generation_id TEXT`,
            `CREATE UNIQUE INDEX IF NOT EXISTS streams_idx ON streams (station_id, generation_id, type)`,
        ]);
        const rows: { station_id: number; generation: string }[] = await db.query(
            "SELECT station_id, generation FROM downloads GROUP BY station_id, generation"
        );
        for (const row of rows) {
            await db.execute("UPDATE streams SET generation_id = ? WHERE station_id = ?", [row.station_id, row.generation]);
        }
    }
}
