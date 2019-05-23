

## Project setup
```
npm install
```

### Compile and hot-reload for development with NativeScript CLI
```
tns run android --bundle
tns run ios --bundle
```

### Compile for production
```
tns build android --bundle
tns build ios --bundle
```

### Run tests
```
npm run test
```

## Troubleshooting

If you get errors about XCode being setup incorrectly and running xcodebuild -version gives you an error like this:

```
xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance
```

Then you probably need to do:

```
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

https://stackoverflow.com/questions/17980759/xcode-select-active-developer-directory-error
