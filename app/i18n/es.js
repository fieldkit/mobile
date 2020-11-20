// prettier-ignore
module.exports = {
    // Include module and sensor names
    ...require('./modules.es'),
    // AssembleStationView.vue
    notIncluded: "no incluido",
    welcome: "¡Bienvenidos!",
    mobileAppIntro: "Nuestra aplicación móvil hace que sea fácil de configurar y desplegar su estación de FieldKit.",
    getStarted: "Empezar",
    skipInstructions: "Saltar instrucciones",
    assembleStation: "Montar la estación",
    haveEverything: "¿Tienes todo?",
    assembleStep1: "Compruebe que tiene todas las piezas necesarias para montar su FieldKit.",
    assembleStep2: "Coloca el tablero de base y la placa de radio juntos.",
    assembleStep3: "Tome el tablero tablero de base y radio combinados y adjuntarlo al plano posterior.",
    assembleStep4: "Adjuntar sus módulos individuales para el avión de vuelta, y luego asegurarlas con tornillos.",
    assembleStep5: "Tome todos los componentes conectados y colocarlos en el interior del recinto de la estación. Asegure el sistema abajo con tornillos.",
    assembleStep6: 'Coloque la batería en la parte superior de la placa de radio donde dice "batería".',
    assembleStep7: 'Inserte el cable de botón a la placa de radio en el puerto "BTN."',
    assembleStep8: "Conecte el cable micro USB para cargar la batería de la estación.",
    assembleStep9: 'Asegúrese de que el interruptor está en la posición "On". Dejar enchufado a cargo de una hora.',
    assembleStep10: "Montado estación",
    enclosure: "Recinto",
    radioBoard: "Planchar Radio",
    coreBoard: "Tablero central",
    backPlane: "Avión de vuelta",
    moduleParts: "Módulo(s)",
    battery: "Batería",
    screws: "Empulgueras",
    microCable: "Cable USB micro",
    screwdriver: "Destornillador",
    // ConnectStationCheck.vue
    connecting: "Conexión",
    // ConnectStationError.vue
    havingProblems: "Tiene problemas para conectarse?",
    problemStep1: "Pulse el botón Wi-Fi de nuevo",
    problemStep2: "A su vez en el punto de acceso WiFi de la estación directamente desde el menú de configuración de la estación",
    problemStep3: "Si usted todavía está teniendo problemas para conseguir ayuda en nuestro apoyo y solución de problemas centro",
    tryAgain: "Inténtalo de nuevo",
    skipStep: "Omita este paso",
    noModulesConnected: "Sin módulos conectados",
    noModulesInstruction: "Complete su estación FieldKit mediante la adición de módulos de sensor.",
    addModules: "Agregar módulos",
    continueWithoutModules: "Continuar sin módulos",
    // ConnectStationForm.vue
    savedNetworks: "Guardadas redes WiFi",
    noSavedNetworks: "No hay redes guardadas",
    show: "Mostrar",
    hide: "Esconder",
    changeStationName: "Cambiar el nombre de la estación FieldKit?",
    changeStationNameInstruction: "Puede cambiar el nombre o dejarlo en el mismo. Siempre puedes cambiarlo más tarde.",
    saveNewName: "Guardar nuevo nombre",
    stationNameHint: "Introduzca un nombre para la estación",
    reconnectToStation: "Vuelva a conectar a tu estación FieldKit",
    yourWifi: "Su red WiFi",
    wifiStep1: "Introduzca el nombre de la red Wi-Fi que le gustaría conectar su estación de FieldKit a.",
    wifiStep2: "Por desgracia, sólo el 2,4 GHz Wi-Fi es compatible actualmente.",
    next: "Próximo",
    networkNameHint: "Introduzca nombre de la red Wi-Fi",
    networkPasswordHint: "Introduzca la contraseña de red",
    // ConnectStationList.vue
    selectYourStation: "Seleccione su estación",
    selectStationInstruction: "Encontramos las estaciones FieldKit. Elegir la emisora ​​que desea conectarse.",
    noStationTryAgain: "¿No ves tu estación? Inténtalo de nuevo.",
    // ConnectStationModules.vue
    connect: "Conectar",
    setup: "Preparar",
    fetchingStationInfo: "Obteniendo información de la estación",
    uncalibrated: "Sin calibrar",
    noCalibrationNeeded: "No se requiere calibración",
    calibrated: "Calibrado",
    startCalibrationStep1: "Vamos a configurar la estación antes de implementar!",
    startCalibrationStep2: "Para completar la configuración, calibrar cada módulo sensor para la detección de los datos precisos.",
    done: "Hecho",
    setupLater: "Configurar mas tarde",
    endCalibrationStep: "Su configuración de estación FieldKit es completa.",
    // ConnectStationView.vue
    fieldkitWifi: "FieldKit WiFi Station",
    introConnectStep1: "Su estación de FieldKit tiene su propia señal de Wi-Fi, que actúa como un punto de acceso y permitiendo la conexión con el dispositivo móvil.",
    introConnectStep2: "Compruebe que la conexión Wi-Fi está en la estación pulsando el botón Wi-Fi externa.",
    connectYourStation: "Conectar su estación FieldKit",
    connectStep1: "Para conectarse a su estación, ir a la configuración de Wi-Fi del teléfono móvil y seleccionar el nombre de la estación de conexión Wi-Fi como se muestra en la pantalla de la estación.",
    chooseWifiSettings: "Seleccione Configuración WiFi",
    chooseWifiInstruction: "Elija cómo desea sincronizar sus datos",
    stationWifi: "Estación de conexión Wi-Fi (por defecto)",
    stationWifiInfo: "Su estación de FieldKit tiene su propia señal de Wi-Fi, que actúa como un punto de acceso y permite la conexión a un dispositivo móvil",
    yourWifiInfo: "Conectar su estación de FieldKit a su propia red Wi-Fi para sincronizar datos con el portal FieldKit directamente. Por desgracia, sólo el 2,4 GHz Wi-Fi es compatible actualmente.",
    reconnectInstruction: "Para volver a conectarse a su estación, ir a la configuración de Wi-Fi del teléfono móvil y seleccionar el nuevo nombre de la estación de conexión Wi-Fi como se muestra en la pantalla de la estación.",
    // Recalibrate.vue
    goToStations: "Ir a las estaciones",
    noModulesAttachedTitle: "No Modules Attached",
    noModulesAttachedBody: "Your stations needs modules in order to complete setup, deploy and capture data.",
    // StationSettingsCaptureSchedule.vue
    // StationSettingsConnectionNote.vue
    mustBeConnected: "Nota: Debe estar conectado a la estación para hacer este cambio.",
    // StationSettingsEndDeploy.vue
    notCurrentlyRecording: "Actualmente no está grabando.",
    areYouSureStopRecording: "¿Seguro que desea detener la grabación?",
    // StationSettingsFirmware.vue
    firmware: "Firmware",
    stationFirmwareVersion: "Versión de firmware de la estación",
    firmwareNumber: "Número de firmware",
    appFirmwareVersion: "Aplicación tiene la versión de firmware",
    upToDate: "Usted está al día!",
    additionalInfo: "Información Adicional",
    firmwareBuild: "Acumulación de firmware",
    deviceId: "ID del dispositivo",
    // StationSettingsGeneral.vue
    general: "General",
    stationName: "Nombre de estación",
    // StationSettingsLoRa.vue
    longRangeNetwork: "Red de Largo Alcance",
    // StationSettingsModule.vue
    moduleTitle: "Módulo",
    calibration: "Calibración",
    calibrateSensor: "Calibrar sensor",
    calibrationRecommendation: "Calibrar el sensor en cualquier momento. Se recomienda calibrar cada 6 meses a un año.",
    noCalibrationNeededSensor: "No se requiere calibración para este sensor.",
    // StationSettingsModuleList.vue
    modulesTitle: "Módulos",
    // StationSettingsName.vue
    saveName: "Guardar Nombre",
    // StationSettingsNetworks.vue
    networks: "Redes",
    wifi: "WiFi",
    lora: "LoRa",
    // StationSettingsView.vue
    stationSettings: "Ajustes de la Estación",
    // StationSettingsWiFi.vue
    network: "Red",
    uploadSchedule: "Subir Horario",
    // StationSettingsWiFiNetwork.vue
    wifiNetwork: "Red WiFi",
    maxTwoNetworksWarning: "Un máximo de dos redes WiFi puede ser salvado. Por favor, quitar uno si desea añadir otro.",
    uploadConfigUpdated: "Cargar la configuración se ha actualizado.",
    unableToUpdate: "No se puede actualizar",
    pleaseLogin: "Por favor inicie sesión para realizar esta acción.",
    noteNeedInternet: "Nota: es necesario estar conectado a internet con el fin de realizar esta acción.",
    configuredToUploadDirectly: "Su estación está actualmente configurado para cargar datos directamente a través de WiFi.",
    uploadViaApp: "Subir a través de la aplicación",
    noteUploadDirectlyOption: "Si lo desea, puede configurar su estación para cargar datos directamente a través de WiFi.",
    uploadOverWifi: "Sube a través de WiFi",
    areYouSureRemoveNetwork: "¿Está seguro de que desea eliminar esta red?",
    // StationSettingsWiFiSchedule.vue
    // UpgradeFirmwareModal.vue
    upgradeInProcess: "Actualización de firmware de la estación. Gracias por su paciencia.",
    noLocalFirmwareOffline: "Sin firmware local y sin estar conectado por lo que ninguno puede ser descargado.",
    downloadingFirmware: "La descarga de firmware.",
    upgradeDone: "Asciende hecho, su estación está reiniciando.",
    downloaded: "Descargado.",
    // AppSettingsView.vue
    fieldkitSettings: "Ajustes FieldKit",
    // CalibrationView.vue
    stationDisconnectedTapHere: "Estación desconectado. Toque aquí para volver a conectar.",
    expectedValue: "Valor esperado",
    calibrationFailed: "Error de calibración",
    calibrationErrorOccured: "Se ve como un error ha ocurrido. Trate de calibración de nuevo ahora o tratar más adelante, si lo prefiere.",
    calibrateLater: "Calibrar tarde",
    waterPh: "El pH del agua",
    chooseCalibrationType: "Elegir el tipo de calibración",
    choosePhInstruction: "¿Le gustaría realizar una calibración rápida o calibración de tres puntos?",
    quickCalibration: "Calibración rápida",
    threePointCalibration: "La calibración de tres puntos",
    quickPhCalibration: "Calibración de pH rápida",
    haveYourQuickSolution: "Asegúrese de que tiene su solución de calibración de pH rápida.",
    rinseWithDeionizedWater: "Enjuague la sonda con agua desionizada.",
    placeProbeInSolutionWithTemp: "Coloque la sonda dentro de la taza con la solución. Asegúrese de que la temperatura del agua es también solución en el interior.",
    startTimer: "Temporizador de inicio",
    calibrate: "Calibrar",
    makeSureYouHavePhFluids: "Asegúrate de que tienes los líquidos de calibración de pH de los niveles de pH 7, 4 y 10.",
    midPointCalibration: "Punto medio de calibración",
    placeProbeIn7Solution: "Lugar copa de sonda en el interior con una solución de 7,0. Asegúrese de que la temperatura del agua es también solución en el interior.",
    lowPointCalibration: "Calibración de bajo punto",
    placeProbeIn4Solution: "Place copa de sonda en el interior con 4,0 solución. Asegúrese de que la temperatura del agua es también solución en el interior.",
    highPointCalibration: "Calibración de alto punto",
    placeProbeIn10Solution: "Lugar copa de sonda en el interior con 10,0 solución. Asegúrese de que la temperatura del agua es también solución en el interior.",
    waterDissolvedOxygen: "Oxygen agua disuelta",
    dissolvedOxygenCalibration: "Calibración de Oxígeno Disuelto",
    dryProbeBefore: "Asegúrese de secar la sonda antes de la calibración.",
    holdProbeOut: "Retener la sonda en la atmósfera.",
    waterConductivity: "Agua Conductividad eléctrica",
    part1Dry: "Parte 1: Seco calibración de conductividad",
    part2Wet: "Parte 2: Wet calibración de conductividad",
    haveYourConductivitySolution: "Asegúrate de que tienes tu solución de conductividad.",
    placeInAndStabilizeWithTemp: "Coloque la sonda dentro de la taza con la solución y dejar que las lecturas se estabilicen. Asegúrese de que la temperatura del agua es también solución en el interior.",
    // ConfigureCaptureInterval.vue
    dataCaptureSchedule: "Datos de programación de captura",
    dataCaptureNotice: "Captura de datos frecuente drena la batería a un ritmo más rápido",
    scheduled: "Programado",
    basic: "Básico",
    captureTime: "Capturar el Tiempo",
    start: "Inicio",
    startBeforeEnd: "Inicio debe ser antes del final",
    end: "Fin",
    endAfterStart: "El final debe ser después del inicio",
    every: "Todo",
    intervalRequired: "Intervalo no debe estar en blanco.",
    intervalTooSmall: "Intervalo debe ser de al menos un minuto.",
    intervalNotNumber: "Intervalo debe ser un número.",
    addTime: "Añadir Tiempo",
    second: "segundo",
    seconds: "segundos",
    minute: "minuto",
    minutes: "minutos",
    hour: "hora",
    hours: "horas",
    day: "día",
    days: "días",
    week: "semana",
    weeks: "semanas",
    month: "mes",
    months: "meses",
    year: "año",
    years: "años",
    saveStartTime: "Guardar Hora de Inicio",
    saveEndTime: "Guardar Tiempo Final",
    // DataSyncView.vue
    dataSync: "Sincronización de datos",
    totalDownAndUploaded: "El total de las lecturas hacia abajo y cargado",
    totalDownloaded: "Lecturas totales descargados",
    totalUploaded: "Lecturas totales subidas",
    lastDownUpload: "Última abajo / carga",
    lastDownload: "Ultima descarga",
    lastUpload: "Última carga",
    downloading: "Descarga",
    notConnectedToStation: "No conectado a la estación",
    checkingDownload: "Comprobación de datos para la descarga ...",
    readings: "Mediciónes",
    waitingToUpload: "La espera para subir",
    toUpload: "para cargar",
    failedCheckConnection: "No se puede cargar. ¿Estas conectado a Internet?",
    uploadSuccessful: "Subida con éxito",
    uploaded: "Subida",
    uploading: "Cargando",
    LoginPrompt: "Usted no está conectado. ¿Le gustaría iniciar sesión para que pueda cargar los datos?",
    yes: "Sí",
    notNow: "No ahora",
    // DeployMapView.vue
    stationDisconnected: "Estación desconectado.",
    nameYourLocation: "El nombre de su ubicación",
    locationRequired: "La ubicación es un campo obligatorio.",
    locationOver255: "La ubicación debe ser inferior a 256 caracteres.",
    locationNotPrintable: "La ubicación debe ser imprimible.",
    continue: "Continuar",
    deployment: "Implementación",
    // DeployNotesView.vue
    fieldNote: "Nota de campo",
    fieldNotes: "Notas de campo",
    photoDescription: "Descripción de la foto",
    describePhoto: "Describir lo que está en la foto",
    complete: "Complete",
    provideDetails: "Ayude a su comunidad a comprender mejor su entorno. Las notas de campo pueden mejorar la comunicación, la resolución de problemas y el conocimiento de los datos.",
    photosRequired: "Fotos (1 requiere)",
    photosInstruction: "Una imagen vale más que mil palabras.",
    additionalNotes: "Notas adicionales",
    addDetails: "¿Algo más? Capture más notas en cualquier momento.",
    addNote: "Añadir Nota",
    save: "Guardar",
    studyObjective: "Objetivo del estudio",
    studyObjectiveInstruction: "¿Cuáles son tus metas?",
    siteLocation: "Objetivo del Sitio Ubicación",
    siteLocationInstruction: "¿Por qué elegiste este lugar?",
    siteCriteria: "Criterios del sitio",
    siteCriteriaInstruction: "¿Cómo satisface tus necesidades?",
    siteDescription: "Descripción del sitio",
    siteDescriptionInstruction: "¿Qué puedes ver a tu alrededor?",
    additionalNoteInstruction: "Pulsar para añadir notas adicionales",
    confirmDeleteNote: "¿Está seguro que desea eliminar esta nota?",
    cancel: "Cancelar",
    addPhoto: "Añadir foto",
    takePicture: "Hacer foto",
    selectFromGallery: "Seleccionar de la galería",
    // DeployReviewView.vue
    stationCoordinates: "Coordenadas de la estación",
    latitude: "Latitud",
    longitude: "Longitud",
    noNameGiven: "Sin nombre dado",
    record: "Grabar",
    mustBeConnectedToRecord: "Debe de estar conectada a la estación para iniciar la grabación",
    deploymentReview: "Revisión de la implementación",
    processing: "Transformando ...",
    // FieldNoteForm.vue
    title: "Título",
    tapToAddTitle: "Toque para añadir un título",
    note: "Nota",
    jan: "Ene",
    feb: "Feb",
    mar: "Mar",
    apr: "Abr",
    may: "Mayo",
    jun: "Jun",
    jul: "Jul",
    aug: "Ago",
    sep: "Sep",
    oct: "Oct",
    nov: "Nov",
    dec: "Dic",
    audioNote: "Nota de audio",
    confirmDeleteRecording: "¿Estás seguro de que quieres eliminar esta grabación?",
    // DeveloperMenuView.vue
    viewStations: "Ver estaciones",
    authenticated: "Usted ha autenticado correctamente",
    currentEnvironment: "El entorno actual es",
    resetCalibration: "Calibración de reposición",
    resetOnboarding: "Restablecer Onboarding",
    uploadDiagnostics: "Subir Diagnóstico",
    deleteDB: "DB borrado",
    deleteFiles: "Borrar archivos",
    crash: "Choque",
    manualCrash: "Manual de Crash",
    devOptions: "Opciones de desarrollo",
    noStationsFound: "No se encontraron estaciones",
    resetDoneGoToOnboarding: "Reset completo! ¿Le gustaría ir a Onboarding?",
    no: "No",
    dbDeleted: "Base de datos eliminados",
    errorRemovingFiles: "Error al eliminar archivos!",
    filesRemoved: "Archivos eliminado!",
    includeThisPhrase: "¡Éxito! Por favor, incluya esta frase en su informe de error:",
    // LoginView.vue
    name: "Nombre",
    email: "Email",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    nameRequired: "El nombre es un campo obligatorio.",
    nameOver255: "El nombre debe tener menos de 256 letras.",
    nameNoSpaces: "El nombre no debe contener espacios.",
    emailRequired: "El correo electrónico es un campo obligatorio.",
    emailNotValid: "Debe ser una dirección de correo electrónico válida.",
    passwordRequired: "La contraseña es un campo requerido.",
    passwordTooShort: "La contraseña debe tener al menos 10 caracteres.",
    forgotLink: "Restablecer contraseña",
    noMatch: "Las contraseñas no coinciden.",
    logIn: "Iniciar sesión",
    signUp: "Regístrate",
    continueOffline: "Continuar sin conexión",
    needAccount: "Crear una cuenta",
    backToLogin: "Atrás para iniciar sesión",
    provideBoth: "Por favor, proporcione una dirección de correo electrónico y una contraseña.",
    loginFailed: "Lamentablemente no hemos podido iniciar sesión. Compruebe sus credenciales e inténtelo de nuevo.",
    accountCreated: "Su cuenta ha sido creada",
    accountCreateFailed: "Desafortunadamente no hemos podido crear su cuenta.",
    forgotTitle: "Restablecer contraseña",
    forgotInstruction: "Ingrese la dirección de correo electrónico que usó para registrarse en FieldKit para restablecer su contraseña.",
    ok: "OK",
    passwordResetSucceeded: "Su contraseña fue restablecido correctamente. Por favor, consultar su correo electrónico para obtener instrucciones sobre cómo elegir una nueva contraseña.",
    passwordResetFailed: "Desafortunadamente, se produjo un error al restablecer su contraseña.",
    // ModuleDetailView.vue
    locateYourModule: "Localiza %s aquí en tu estación FieldKit.",
    select: "Seleccionar ...",
    // ModuleListView.vue
    viewGraph: "Ver Gráfico",
    lastReading: "Última lectura",
    // NotificationFooter.vue
    notifications: "Notificaciones",
    notificationRemindLater: "Remind Later",
    notificationDontRemind: "Don't Remind",
    notificationArchive: "Archive",
    portalProblemHeading: "Problema con la conexión Portal",
    encounteredAPortalError: "Se ha detectado un error al conectar con el Portal.",
    unableToUpdateHeading: "No se puede actualizar Portal",
    doNotHavePortalPermission: "No tenemos permiso para actualizar el Portal para esta estación. Se puede pertenecer a otro usuario.",
    unableToAccessHeading: "No se puede acceder Portal",
    notAuthorizedToUpdatePortal: "En este momento no estamos autorizados para actualizar el Portal. ¿Está registrado?",
    stationDeployedHeading: "Station Deployed",
    stationDeployedText: "Station Deployed Text",
    // NotificationView.vue
    dismiss: "Descartar",
    // ScreenFooter.vue
    stations: "Estaciones",
    data: "Datos",
    settings: "Configuración",
    // ScreenHeader.vue
    // StationDetailView.vue
    stationDeployed: "Estación Implementado",
    readyToDeploy: "Listo para implementare",
    deployed: "Implementado",
    // StationListView.vue
    lookingForStations: "Buscando estaciones ...",
    connectAStation: "Conectar una estación",
    addStation: "Adición de un satélite",
    addStationInstruction: "No tiene estaciones. Añadir una estación para comenzar a recoger datos.",
    confirmViewDevMenu: "¿Quieres ver las opciones de desarrollo?",
    // StationPickerModal.vue
    tapStationToRecalibrate: "Toque la emisora ​​que desea volver a calibrar:",
    // StationSettingsView.vue
    nameOver40: "Nombre tiene un máximo de 40 caracteres.",
    nameNotPrintable: "El nombre debe ser imprimible.",
    endDeployment: "Finalizar implementación",
    mustBeConnectedToStop: "Para cancelar la implementación y detener la grabación de datos, debe estar conectado a su estación.",
    stopRecording: "Detener grabación",
    wifiNetworks: "Redes Wi-Fi",
    addNetwork: "Agregar una red a la estación",
    networkName: "Nombre de la red",
    add: "Agregar",
    loraNetwork: "LoRa (de largo alcance) de la red",
    deviceEUI: "Dispositivo EUI",
    editAppEUI: "Editar App EUI y Clave",
    appEUI: "App EUI",
    invalidAppEUI: "No válida App EUI",
    appKey: "Clave de Aplicación",
    invalidAppKey: "No válido Clave Aplicación",
    submit: "Enviar",
    logOut: "Cerrar sesión",
    // StationStatusBox.vue
    unknown: "Desconocido",
    since: "Ya que",
    recordingData: "Registro de datos",
    notRecording: "No Grabación",
    connected: "Conectado",
    notConnected: "No conectado",
    memoryUsed: "Memoria usada",
    of: "de",
    deploy: "Implementar",
    daysHrsMin: "días hrs min",
    hrsMinSec: "hrs min seg",
    downloadFirmware: "Descargar Firmware",
    upgradeFirmware: "Actualización de Firmware",
    batteryLife: "Battery Life",
    appSettings: {
        title: "Settings",
        data: {
            data: "Data",
            autoSyncStationTitle: "Auto Sync Station",
            autoSyncStationDescription: "Automatically download data from station",
            autoSyncPortalTitle: "Auto Sync Portal",
            autoSyncPortalDescription: "Automatically upload data portal",
            mobileDataUsageTitle: "Mobile Data Usage",
            mobileDataUsageDescription: "Only sync your data to portal while connected WiFi",
        },
        notifications: {
            notifications: "Notifications",
            pushNotificationsTitle: "Push Notifications",
            pushNotificationsDescription: "Placeholder text lorem ipsum"
        },
        units: {
            units: "Units",
            unitSystem: "Unit System",
            imperial: "Imperial",
            metric: "Metric",
            customMetricSettings: "Custom Metric Settings",
            temperature: "Temperature",
            unitName: "Unit Name",
            pressure: "Pressure",
            velocity: "Velocity"
        },
        permissions: {
            permissions: "Permissions",
            locationTitle: "Location",
            filesTitle: "Files",
            cameraTitle: "Camera",
            microphoneTitle: "Microphone",
        },
        account: {
            account: "Account",
            accounts: "Account",
            addAccount: "Add Account",
            logoutAll: "Log Out All Accounts",
            email: 'Email',
            password: 'Password',
            resetPassword: 'Reset Password',
            login: 'Log in',
            createAccount: 'Create an account'
	},
        appearance: {
            appearance: "Appearance",
            fontSize: "Font Size",
            language: "Language",
            darkMode: "Dark Mode",
            english: "English",
            spanish: "Spanish",
            chinese: "Mandarin Chinese",
            tiny: "Tiny",
            huge: "Huge"
        },
        help: {
            help: "Help",
            appVersion: "App Version",
            crashReports: "Crash Reports",
            tutorialGuide: "Tutorial Guide",
            version: "Version",
            updatesTitle: "Updates",
            updatesDescription: "No available updates",
            downloadUpdatesTitle: "Download Updates",
            downloadUpdatesDescription: "Download FieldKit app updates automatically when on WiFi internet "
        },
        legal: {
            legal: "Legal",
            termsOfService: "Terms of Service",
            privacyPolicy: "Privacy Policy",
            dataPolicy: "Data Policy",
            licenses: "Licenses"
        },
        lorem: "Lorem ipsum"
    }
};
