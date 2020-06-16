// prettier-ignore
module.exports = {
    // Include module and sensor names
    ...require('./modules.en'),
    // AssembleStationView.vue
    notIncluded: "not included",
    welcome: "Welcome!",
    mobileAppIntro: "Our mobile app makes it easy to set up and deploy your FieldKit station.",
    getStarted: "Get Started",
    skipInstructions: "Skip instructions",
    assembleStation: "Assemble Station",
    haveEverything: "Do You Have Everything?",
    assembleStep1: "Check that you have all of the necessary parts to assemble your FieldKit.",
    assembleStep2: "Place your core board and radio board together.",
    assembleStep3: "Take the combined core board and radio board and attach it to the back plane.",
    assembleStep4: "Attach your individual modules to the back plane, then secure them with screws.",
    assembleStep5: "Take all of your attached components and place them inside the station enclosure. Secure the system down with screws.",
    assembleStep6: 'Attach the battery at the top of the radio board where it says "BATTERY."',
    assembleStep7: 'Insert the button cord to the radio board into the port labeled "BTN."',
    assembleStep8: "Plug in your micro USB cable to charge the station battery.",
    assembleStep9: 'Make sure that the switch is in the "On" position. Leave plugged in to charge for an hour.',
    assembleStep10: "Station Assembled",
    enclosure: "Enclosure",
    radioBoard: "Radio board",
    coreBoard: "Core board",
    backPlane: "Back plane",
    moduleParts: "Module(s)",
    battery: "battery",
    screws: "Screws",
    microCable: "Micro USB cable",
    screwdriver: "Screwdriver",
    // ConnectStationCheck.vue
    connecting: "Connecting",
    // ConnectStationError.vue
    havingProblems: "Having Problems Connecting?",
    problemStep1: "Press the WiFi button again",
    problemStep2: "Turn on station's WiFi access point directly from the station settings menu",
    problemStep3: "If you are still having trouble get help at our support and troubleshooting center",
    tryAgain: "Try Again",
    skipStep: "Skip this step",
    noModulesConnected: "No Modules Connected",
    noModulesInstruction: "Complete your FieldKit Station by adding sensor modules.",
    addModules: "Add Modules",
    continueWithoutModules: "Continue without modules",
    // ConnectStationForm.vue
    savedNetworks: "Saved WiFi Networks",
    noSavedNetworks: "No saved networks",
    show: "Show",
    hide: "Hide",
    changeStationName: "Change your FieldKit station name?",
    changeStationNameInstruction: "You can change the name or leave it the same. You can always change it later.",
    saveNewName: "Save New Name",
    stationNameHint: "Enter a name for your station",
    reconnectToStation: "Reconnect to your FieldKit Station",
    yourWifi: "Your WiFi Network",
    wifiStep1: "Enter the name of the WiFi network you would like to connect your FieldKit station to.",
    wifiStep2: "Unfortunately, only 2.4GHz WiFi is currently supported.",
    next: "Next",
    networkNameHint: "Enter WiFi network name",
    networkPasswordHint: "Enter network password",
    // ConnectStationList.vue
    selectYourStation: "Select Your Station",
    selectStationInstruction: "We found FieldKit Stations. Choose the station you want to connect to.",
    noStationTryAgain: "Don't see your station? Try again.",
    // ConnectStationModules.vue
    connect: "Connect",
    setup: "Set Up",
    fetchingStationInfo: "Fetching station information",
    uncalibrated: "Uncalibrated",
    noCalibrationNeeded: "No calibration needed",
    calibrated: "Calibrated",
    startCalibrationStep1: "Let's set up your station before you deploy!",
    startCalibrationStep2: "To complete setup, calibrate each sensor module for accurate data readings.",
    done: "Done",
    setupLater: "Set up later",
    endCalibrationStep: "Your FieldKit station setup is complete.",
    // ConnectStationView.vue
    fieldkitWifi: "FieldKit Station WiFi",
    introConnectStep1: "Your FieldKit station has its own WiFi signal, acting as a hotspot and allowing connection to your mobile device.",
    introConnectStep2: "Confirm that your station WiFi is on by pressing the external WiFi button.",
    connectYourStation: "Connect your FieldKit Station",
    connectStep1: "To connect to your station, go to your mobile phone WiFi settings and select the station's WiFi name as displayed on the station screen.",
    chooseWifiSettings: "Choose WiFi Settings",
    chooseWifiInstruction: "Choose how you would like to sync your data",
    stationWifi: "Station WiFi (default)",
    stationWifiInfo: "Your FieldKit station has its own WiFi signal, acting as a hotspot and allowing connection to a mobile device",
    yourWifiInfo: "Connect your FieldKit station to your own WiFi network to sync data with the FieldKit portal directly. Unfortunately, only 2.4GHz WiFi is currently supported.",
    reconnectInstruction: "To reconnect to your station, go to your mobile phone WiFi settings and select the station's new WiFi name as displayed on the station screen.",
    // Recalibrate.vue
    goToStations: "Go to stations",
    // ConfigureCaptureInterval.vue
    dataCaptureSchedule: "Data capture schedule",
    dataCaptureNotice: "Frequent data capture drains the battery at a quicker rate",
    scheduled: "Scheduled",
    basic: "Basic",
    captureTime: "Capture Time",
    start: "Start",
    startBeforeEnd: "Start must be before end",
    end: "End",
    endAfterStart: "End must be after start",
    every: "Every",
    intervalRequired: "Interval must not be blank.",
    intervalNotNumber: "Interval must be a number.",
    addTime: "Add Time",
    second: "second",
    seconds: "seconds",
    minute: "minute",
    minutes: "minutes",
    hour: "hour",
    hours: "hours",
    day: "day",
    days: "days",
    week: "week",
    weeks: "weeks",
    month: "month",
    months: "months",
    year: "year",
    years: "years",
    saveStartTime: "Save Start Time",
    saveEndTime: "Save End Time",
    // DataSyncView.vue
    downloading: "Downloading",
    notConnectedToStation: "Not connected to station",
    checkingDownload: "Checking for data to download...",
    readings: "Readings",
    waitingToUpload: "Waiting to upload",
    toUpload: "to upload",
    failedCheckConnection: "Unable to upload. Are you connected to the internet?",
    uploadSuccessful: "Upload successful",
    uploaded: "Uploaded",
    uploading: "Uploading",
    loginPrompt: "You're not logged in. Would you like to login so that you can upload your data?",
    yes: "Yes",
    notNow: "Not Now",
    // DeployMapView.vue
    nameYourLocation: "Name your location",
    locationRequired: "Location is a required field.",
    locationOver255: "Location must be less than 256 characters.",
    locationNotPrintable: "Location must be printable.",
    continue: "Continue",
    deployment: "Deployment",
    // DeployNotesView.vue
    complete: "Complete",
    provideDetails: "Help your community better understand their environment. Field notes can improve communication, troubleshooting and data insights.",
    photosRequired: "Photos (1 required)",
    photosInstruction: "A picture speaks a thousand words.",
    additionalNotes: "Additional Notes",
    addDetails: "Anything else? Capture more notes at any time.",
    addNote: "Add Note",
    save: "Save",
    studyObjective: "Study Objective",
    studyObjectiveInstruction: "What are your goals?",
    siteLocation: "Purpose of Site Location",
    siteLocationInstruction: "Why did you pick this spot?",
    siteCriteria: "Site Criteria",
    siteCriteriaInstruction: "How does it meet your needs?",
    siteDescription: "Site Description",
    siteDescriptionInstruction: "What can you see around you?",
    additionalNoteInstruction: "Tap to add additional notes",
    confirmDeleteNote: "Are you sure you want to delete this note?",
    cancel: "Cancel",
    addPhoto: "Add a photo",
    takePicture: "Take picture",
    selectFromGallery: "Select from gallery",
    // DeployReviewView.vue
    stationCoordinates: "Station Coordinates",
    latitude: "Latitude",
    longitude: "Longitude",
    noNameGiven: "No name given",
    record: "Record",
    mustBeConnectedToRecord: "Must be connected to station to start recording",
    deploymentReview: "Deployment Review",
    processing: "Processing...",
    // FieldNoteForm.vue
    jan: "Jan",
    feb: "Feb",
    mar: "Mar",
    apr: "Apr",
    may: "May",
    jun: "Jun",
    jul: "Jul",
    aug: "Aug",
    sep: "Sep",
    oct: "Oct",
    nov: "Nov",
    dec: "Dec",
    audioNote: "audio note",
    confirmDeleteRecording: "Are you sure you want to delete this recording?",
    // DeveloperMenuView.vue
    viewStations: "View Stations",
    authenticated: "You have successfully authenticated.",
    // LoginView.vue
    name: "Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    nameRequired: "Name is a required field.",
    nameOver255: "Name must be less than 256 letters.",
    nameNoSpaces: "Name must not contain spaces.",
    emailRequired: "Email is a required field.",
    emailNotValid: "Must be a valid email address.",
    passwordRequired: "Password is a required field.",
    passwordTooShort: "Password must be at least 10 characters.",
    forgotLink: "Reset password",
    noMatch: "Your passwords do not match.",
    logIn: "Log In",
    signUp: "Sign Up",
    continueOffline: "Continue Offline",
    needAccount: "Create an account",
    backToLogin: "Back to Log In",
    provideBoth: "Please provide both an email address and password.",
    loginFailed: "Unfortunately we were unable to log you in. Please check your credentials and try again.",
    accountCreated: "Your account was successfully created.",
    accountCreateFailed: "Unfortunately we were unable to create your account.",
    forgotTitle: "Reset password",
    forgotInstruction: "Enter the email address you used to register for FieldKit to reset your password.",
    ok: "OK",
    passwordResetSucceeded: "Your password was successfully reset. Please check your email for instructions on choosing a new password.",
    passwordResetFailed: "Unfortunately, an error occurred resetting your password.",
    // ModuleDetailView.vue
    locateYourModule: "Locate %s here on your FieldKit station.",
    select: "Select...",
    // ModuleListView.vue
    viewGraph: "View Graph",
    // NotificationFooter.vue
    notifications: "Notifications",
    // NotificationView.vue
    dismiss: "Dismiss",
    // ScreenFooter.vue
    stations: "Stations",
    data: "Data",
    settings: "Settings",
    // ScreenHeader.vue
    // StationDetailView.vue
    stationDeployed: "Station Deployed",
    readyToDeploy: "Ready to deploy",
    deployed: "Deployed",
    // StationListView.vue
    lookingForStations: "Looking for stations ...",
    // StationSettingsView.vue
    nameOver40: "Name has a 40-character maximum.",
    nameNotPrintable: "Name must be printable.",
    endDeployment: "End Deployment",
    mustBeConnectedToStop: "To undeploy and stop recording data, you must be connected to your station.",
    stopRecording: "Stop Recording",
    wifiNetworks: "WiFi Networks",
    addNetwork: "Add a network to station",
    networkName: "Network name",
    add: "Add",
    loraNetwork: "LoRa (Long Range) Network",
    deviceEUI: "Device EUI",
    editAppEUI: "Edit App EUI and Key",
    appEUI: "App EUI",
    invalidAppEUI: "Invalid App EUI",
    appKey: "App Key",
    invalidAppKey: "Invalid App Key",
    submit: "Submit",
    logOut: "Log Out",
    // StationStatusBox.vue
    recordingData: "Recording Data",
    notRecording: "Not Recording",
    connected: "Connected",
    notConnected: "Not Connected",
    memoryUsed: "Memory used",
    of: "of",
    deploy: "Deploy",
    daysHrsMin: "days hrs min",
    hrsMinSec: "hrs min sec",
	downloadFirmware: "Download Firmware",
	upgradeFirmware: "Upgrade Firmware"
};
