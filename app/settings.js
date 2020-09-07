const settings = {
    data: {
        auto_sync_station: true,
        auto_sync_portal: true,
        mobile_data_usage: true
    },
    notifications: {
        push_notifications: true
    },
    units: {
        unit_system: 'imperial',
        temperature: 'c',
        unit_name: 'mgl',
        pressure: 'kpa',
        velocity: 'kpa'
    },
    permissions: {
        location: true,
        files: true,
        camera: true,
        microphone: true
    },
    appearance: {
        font_size: 2,
        language: 'english',
        dark_mode: false
    },
    help: {
        app_version: {
            updates: false,
            download_updates: true
        },
        crash_reports: true,
        tutorial_guide: false
    },
    legal: {}
};

export default settings;
