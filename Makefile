ANDROID ?= $(HOME)/Android/Sdk/tools/bin

default: setup

setup: .setup-completed

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
