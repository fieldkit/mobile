export const Connectivity = {
    connectionType: {
        none: 0,
        wifi: 1,
        mobile: 2,
        ethernet: 3,
        bluetooth: 4,
    },
    startMonitoring: (callback: (newType: number) => void) => {
        return Promise.resolve();
    },
};

export const knownFolders = {
    documents: () => {
        return {
            path: "/var/tests/docs",
        };
    },
};
