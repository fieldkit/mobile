ANDROID ?= $(HOME)/Android/Sdk/tools/bin
APP ?= ./

NSSQLITE = nativescript-sqlite-commercial-1.3.2.tgz

default: setup test

setup: .setup-completed $(APP)/app/secrets.ts $(APP)/node_modules
	mkdir -p backup

.setup-completed:
	$(ANDROID)/sdkmanager --verbose "system-images;android-28;google_apis;x86_64"
	$(ANDROID)/sdkmanager --verbose "system-images;android-29;google_apis;x86_64"
	$(ANDROID)/sdkmanager --verbose "system-images;android-30;google_apis;x86_64"
	$(ANDROID)/sdkmanager --verbose "platforms;android-29"
	$(ANDROID)/sdkmanager --verbose "emulator"
	echo | $(ANDROID)/avdmanager create avd --force -n test -k "system-images;android-29;google_apis;x86_64"
	touch .setup-completed
	pip3 install requests

refresh-cms-data:
	cd tools && npm install && npm run start

update:
	$(ANDROID)/sdkmanager --update --verbose

emulator:
	sudo $(ANDROID)/../emulator -avd test

$(APP)/app/secrets.ts: $(APP)/app/secrets.ts.template
	cp $^ $@

prettier:
	prettier --write "$(APP)/app/**/*.{ts,js,css,json,vue}"

$(APP)/node_modules:
	rm -rf $(APP)/node_modules/*/.git $(APP)/node_modules/fk-*-protocol
	cd $(APP) && npm cache clean --force && npm install
	git config core.hooksPath .githooks

jenkins: setup
	rm -rf $(APP)/node_modules
	cd $(APP) && npm install
	cd $(APP) && npm test

clean-secrets:
	rm -rf $(APP)/app/secrets.ts

platform-libraries:
	if [ -f $(NSSQLITE) ]; then                           \
		ns plugin add $(NSSQLITE);                    \
		mkdir -p backup;                              \
		mv $(NSSQLITE) backup/$(NSSQLITE);            \
	fi

android-release: setup
	rm -rf $(APP)/node_modules/*/.git
	rm -rf $(APP)/node_modules/nativescript-conservify
	rm -rf $(APP)/node_modules/fk-*-protocol
	jq '.nativescript.id = "com.fieldkit"' $(APP)/package.json > $(APP)/package.json.temp
	mv $(APP)/package.json.temp $(APP)/package.json
	npm install
	$(MAKE) refresh-cms-data || true
	$(MAKE) platform-libraries
	cd $(APP) && ns build android --release --env.sourceMap --key-store-path $(FK_APP_RELEASE_STORE_FILE) --key-store-password $(FK_APP_RELEASE_STORE_PASSWORD) --key-store-alias $(FK_APP_RELEASE_KEY_ALIAS) --key-store-alias-password $(FK_APP_RELEASE_KEY_PASSWORD)
	cd $(APP) && ns build android --release --env.sourceMap --key-store-path $(FK_APP_RELEASE_STORE_FILE) --key-store-password $(FK_APP_RELEASE_STORE_PASSWORD) --key-store-alias $(FK_APP_RELEASE_KEY_ALIAS) --key-store-alias-password $(FK_APP_RELEASE_KEY_PASSWORD) --aab

ios-release: setup
	security list-keychains
	security lock-keychain login.keychain
	security unlock-keychain -p $(APP_IOS_KEYCHAIN_PASSWORD) login.keychain
	security show-keychain-info login.keychain
	rm -rf $(APP)/node_modules/*/.git
	rm -rf $(APP)/node_modules/nativescript-conservify
	rm -rf $(APP)/node_modules/fk-*-protocol
	npm install
	$(MAKE) refresh-cms-data || true
	if [ -d $(APP)/platforms/ios ]; then               \
		cd $(APP) && ns platform clean ios || true    ;\
	else                                               \
		cd $(APP) && ns platform add ios || true      ;\
	fi
	$(MAKE) platform-libraries
	xcode-select -p
	xcodebuild -version
	xcrun simctl list
	cd $(APP) && ns build ios --provision || true
	cd $(APP) && ns build ios --team-id || true
	cd $(APP) && ns build ios --provision "Conservify Ad Hoc (2020/01)" --for-device --env.sourceMap --log trace
	cd $(APP) && ns build ios --provision "Conservify Ad Hoc (2020/01)" --for-device --release --env.sourceMap

android-logs:
	adb logcat | grep -i " JS" | grep -v NSVue

android-logs-verbose:
	adb logcat | grep -i " JS"

android-debug: setup
	cd $(APP) && ns platform add android || true
	$(MAKE) platform-libraries
	cd $(APP) && ns debug android --no-hmr

ios-debug: setup
	cd $(APP) && ns platform add ios || true
	$(MAKE) platform-libraries
	cd $(APP) && ns debug ios --no-hmr

clean:
	rm -rf $(APP)/node_modules
	rm -rf $(APP)/platforms

images:
	for a in $(APP)/app/images/Icon*.svg; do  \
		SOURCE=../$$a;    \
		DIR=`dirname $$a`; \
		PNG=`basename $$a .svg`.png; \
		OUTPUT=../$$DIR/$$PNG;   \
		(cd $(APP) && node_modules/.bin/svgexport $$SOURCE $$OUTPUT 16x); \
  done; \
	for a in $(APP)/app/images/*logo*.svg; do  \
		SOURCE=../$$a;    \
		DIR=`dirname $$a`; \
		PNG=`basename $$a .svg`.png; \
		OUTPUT=../$$DIR/$$PNG;   \
		(cd $(APP) && node_modules/.bin/svgexport $$SOURCE $$OUTPUT 2x); \
  done; \

test: setup
	jest --silent

watch: setup
	jest --silent --watch

update-third-party:
	third-party/update.sh

ios-devices:
	xcrun xctrace list devices
	idevice_id --list

ios-logs:
	idevicesyslog --udid `idevice_id --list` -p "mobile(NativeScript)"

cycle-checks:
	npx madge --circular --extensions ts ./app
