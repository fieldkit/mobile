ANDROID ?= $(HOME)/Android/Sdk/tools/bin
APP ?= FieldKit

default: setup

setup: .setup-completed $(APP)/app/secrets.ts $(APP)/node_modules

.setup-completed:
	$(ANDROID)/sdkmanager --verbose "system-images;android-25;google_apis;x86"
	$(ANDROID)/sdkmanager --verbose "system-images;android-26;google_apis;x86"
	$(ANDROID)/sdkmanager --verbose "system-images;android-27;google_apis;x86"
	$(ANDROID)/sdkmanager --verbose "system-images;android-28;google_apis;x86"
	$(ANDROID)/sdkmanager --verbose "platforms;android-28"
	$(ANDROID)/sdkmanager --verbose "emulator"
	echo | $(ANDROID)/avdmanager create avd --force -n test -k "system-images;android-26;google_apis;x86"
	touch .setup-completed

update:
	$(ANDROID)/sdkmanager --update --verbose

emulator:
	sudo $(ANDROID)/../emulator -avd test

$(APP)/app/secrets.ts: $(APP)/app/secrets.ts.template
	cp $^ $@

prettier:
	prettier --write "$(APP)/app/**/*.{ts,js,css,json}"

$(APP)/node_modules:
	rm -rf $(APP)/node_modules/*/.git $(APP)/node-modules/fk-*-protocol
	cd $(APP) && npm install
	git config core.hooksPath .githooks

jenkins: setup
	rm -rf $(APP)/node_modules
	cd $(APP) && npm install
	cd $(APP) && npm test

android-release: setup
	rm -rf $(APP)/node_modules/*/.git
	npm install
	cd $(APP) && tns build android --release --key-store-path $(FK_APP_RELEASE_STORE_FILE) --key-store-password $(FK_APP_RELEASE_STORE_PASSWORD) --key-store-alias $(FK_APP_RELEASE_KEY_ALIAS) --key-store-alias-password $(FK_APP_RELEASE_KEY_PASSWORD)
	cd $(APP) && tns build android --release --key-store-path $(FK_APP_RELEASE_STORE_FILE) --key-store-password $(FK_APP_RELEASE_STORE_PASSWORD) --key-store-alias $(FK_APP_RELEASE_KEY_ALIAS) --key-store-alias-password $(FK_APP_RELEASE_KEY_PASSWORD) --aab

ios-release: setup
	security list-keychains
	security lock-keychain login.keychain
	security unlock-keychain -p $(APP_IOS_KEYCHAIN_PASSWORD) login.keychain
	security show-keychain-info login.keychain
	rm -rf $(APP)/node_modules/*/.git
	npm install
	cd $(APP) && tns build ios --provision || true
	cd $(APP) && tns build ios --team-id || true
	cd $(APP) && tns build ios --provision "Conservify Ad Hoc" --for-device
	cd $(APP) && tns build ios --provision "Conservify Ad Hoc" --for-device --release

android-logs:
	adb logcat | grep -i " JS" | grep -v NSVue
