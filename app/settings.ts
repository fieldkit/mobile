const settings = {
    data: {
        autoSyncStation: true,
        autoSyncPortal: true,
        mobileDataUsage: true
    },
    notifications: {
        pushNotifications: true
    },
    units: {
        unitSystem: 'imperial',
        temperature: 'c',
        unitName: 'mgl',
        pressure: 'kPa',
        velocity: 'kPa'
    },
    permissions: {
        location: true,
        files: true,
        camera: true,
        microphone: true
    },
    appearance: {
        fontSize: 2,
        language: 'english',
        darkMode: false
    },
    help: {
        appVersion: {
            updates: false,
            downloadUpdates: true
        },
        crashReports: true,
        tutorialGuide: true
    },
    legal: {}
};

export default settings;
