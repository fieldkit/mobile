import { Observable } from "tns-core-modules/data/observable";

export const HiddenProperty = "valueChanged";

export class BetterObservable extends Observable {
    constructor() {
        super();
        this.has_value = false;
        this.value = null;
    }

    subscribe(receiver) {
        if (!this.has_value) {
            this.refresh();
        } else {
            receiver(this.value);
        }

        this.on(Observable.propertyChangeEvent, data => {
            switch (data.propertyName.toString()) {
                case HiddenProperty: {
                    receiver(data.value);
                    break;
                }
            }
        });
    }

    publish(value) {
        this.value = value;
        this.has_value = true;
        this.notifyPropertyChange(HiddenProperty, value);
    }

    refresh() {
        return this.getValue()
            .then(value => {
                if (value != null) {
                    this.publish(value);
                }
                return value;
            })
            .catch(error => {
                console.log("error", error);
            });
    }

    getValue() {
        return Promise.resolve(null);
    }
}

export function every(time, value) {
    const observable = new Observable()
    observable.notifyPropertyChange(HiddenProperty, value);
    setInterval(() => {
        observable.notifyPropertyChange(HiddenProperty, value);
    }, time);
    return observable;
}
