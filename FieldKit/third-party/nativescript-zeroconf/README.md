# nativescript-zeroconf

Add your plugin badges here. See [nativescript-urlhandler](https://github.com/hypery2k/nativescript-urlhandler) for example.

This nativescript-zeroconf plugin provides a Zeroconf/Bonjour implementation for both iOS and Android. Currently, it only supports discovering domains and services in the local network. Should there be any requests, I might implement the service registration parts as well (please open an issue to let me know).

## Demo Application

This repository contains a demo application in the `demo-angular` folder that uses this plugin to display discovered Zeroconf domains and services. The demo app can be a good starting point for your app and may be used for narrowing down issues whilst debugging. Just clone this repo and run `npm run demo.<platform>` in the `src` folder.

The demo app searches for by default for `http` services, but you can easily adjust the `serviceType` in `app/zeroconf/zeroconf.provider.ts`.


## Installation

```javascript
tns plugin add nativescript-zeroconf
```

## Usage 

First, import the plugin into your provider/component, and, since the plugin returns an `Observable` also the relevant types:

```javascript
import { Zeroconf } from 'nativescript-zeroconf';
import { Observable, PropertyChangeData } from 'tns-core-modules/data/observable';
```

Then, instantiate a Zeroconf and define the event listeners:

```javascript
    this.zeroconf = new Zeroconf('_http._tcp.', 'local.'); // param 1 = service type, param 2 = domain

    /* define event listener */

    this.zeroconf.on(Observable.propertyChangeEvent, (data: PropertyChangeData) => {
      switch(data.propertyName.toString()) {
        case 'serviceFound': {
          console.log(`serviceFound: ${JSON.stringify(data.value)}`);
          break;
        }
      }
    });

    this.zeroconf.startServiceDiscovery();
```

Tip: have a look at the demo project for an example implementation

## API

Describe your plugin methods and properties here. See [nativescript-feedback](https://github.com/EddyVerbruggen/nativescript-feedback) for example.

| Property | Default | Description |
| --- | --- | --- |
| some property | property default value | property description, default values, etc.. |
| another property | property default value | property description, default values, etc.. |

## Limitations

## License

MIT license (see LICENSE file)
