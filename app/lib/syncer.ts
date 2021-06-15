/*


  By user (profile, notifications)
  By station (status, data, notes)

  Collections
  JSON
  BLOBs

*/

import _ from "lodash";
import { debug } from "./debugging";

export interface Syncable {
    sync(): Promise<void>;
}

type Merge<TLocal, TRemote> = { local: TLocal; remote: TRemote };

export interface SyncNode<TKey, TLocal, TRemote> extends Syncable {
    local(): Promise<TLocal[]>;
    remote(): Promise<TRemote[]>;
    localKey(local: TLocal): TKey;
    remoteKey(remote: TRemote): TKey;
    merge(merge: Merge<TLocal, TRemote>): Merge<TLocal, TRemote>;
}

export abstract class BaseSyncNode<TKey, TLocal, TRemote> implements SyncNode<TKey, TLocal, TRemote> {
    // constructor() {}

    public async sync(): Promise<void> {
        const localAll: TLocal[] = await this.local();
        const remoteAll: TRemote[] = await this.remote();

        const localKeyed = _.keyBy(localAll, this.localKey.bind(this)) as { [index: string]: TLocal };
        const remoteKeyed = _.keyBy(remoteAll, this.remoteKey.bind(this)) as { [index: string]: TRemote };

        const addLocalKeys = _.difference(_.keys(localKeyed), _.keys(remoteKeyed));
        const addRemoteKeys = _.difference(_.keys(remoteKeyed), _.keys(localKeyed));
        const updatingKeys = _.intersection(_.keys(localKeyed), _.keys(remoteKeyed));

        const updating: Merge<TLocal, TRemote>[] = updatingKeys.map((key): Merge<TLocal, TRemote> => {
            const local = localKeyed[key];
            const remote = remoteKeyed[key];
            if (!local) throw new Error();
            if (!remote) throw new Error();
            return {
                local: local,
                remote: remote,
            };
        });

        const merged = updating.map((m) => this.merge(m));

        debug.log(addLocalKeys);
        debug.log(addRemoteKeys);
        debug.log(merged);

        return await Promise.resolve();
    }

    public local(): Promise<TLocal[]> {
        throw new Error();
    }

    public remote(): Promise<TRemote[]> {
        throw new Error();
    }

    public localKey(_local: TLocal): TKey {
        throw new Error();
    }

    public remoteKey(_remote: TRemote): TKey {
        throw new Error();
    }

    public merge(_merge: Merge<TLocal, TRemote>): Merge<TLocal, TRemote> {
        throw new Error();
    }

    public updateLocal(_local: TLocal[]): Promise<void> {
        throw new Error();
    }

    public updateRemote(_remote: TRemote[]): Promise<void> {
        throw new Error();
    }
}

export class Syncer {
    // constructor() {}

    public async sync(node: Syncable): Promise<void> {
        await node.sync();
    }
}

export class ProfileSync extends BaseSyncNode<string, string, string> {
    constructor(public readonly email: string) {
        super();
    }
}

export class NotificationSync extends BaseSyncNode<string, string, string> {
    constructor(public readonly email: string) {
        super();
    }
}

type StationKey = string;
type LocalStation = string;
type RemoteStation = string;

export class StationSync extends BaseSyncNode<StationKey, LocalStation, RemoteStation> {
    constructor(public readonly stationId: number) {
        super();
    }

    public async local(): Promise<LocalStation[]> {
        return Promise.resolve([]);
    }

    public async remote(): Promise<RemoteStation[]> {
        return Promise.resolve([]);
    }

    public localKey(local: LocalStation): StationKey {
        return local;
    }

    public remoteKey(remote: RemoteStation): StationKey {
        return remote;
    }

    public merge({ local, remote }: Merge<LocalStation, RemoteStation>): Merge<LocalStation, RemoteStation> {
        return { local, remote };
    }
}

export class MediaSync extends BaseSyncNode<string, string, string> {
    //
}

export class FkpbSync extends BaseSyncNode<string, string, string> {
    //
}

export class StationDataSync extends BaseSyncNode<string, string, string> {
    constructor(public readonly stationId: number) {
        super();
    }
}

export class FieldDataSync extends BaseSyncNode<string, string, string> {
    constructor(public readonly stationId: number) {
        super();
    }
}

// syncer = new Syncer();
// syncer.sync(new StationSync(1));
// syncer.sync(new FieldDataSync(1));

export class NoteMedia {
    constructor(public readonly key: string, public readonly path: string) {}
}

export class FieldNote {
    constructor(public readonly key: string, public readonly body: string, public readonly attached: NoteMedia[]) {}
}

export class FieldData {}

export class Notification {
    constructor(public readonly key: string) {}
}
