const superProto = android.app.Application.prototype;

android.app.Application.extend("org.fieldkit.NativeScriptMultiDexApp", {
    onCreate: function() {
        superProto.onCreate.call(this);
    },
    attachBaseContext: function(base) {
        superProto.attachBaseContext.call(this, base);
        androidx.multidex.MultiDex.install(this);
    },
});
