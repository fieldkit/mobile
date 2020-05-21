import { Observable } from "./observable";

export const HiddenProperty = "valueChanged";

export class BetterObservable extends Observable {
    constructor() {
        super();
        this.hasValue = false;
        this.value = null;
        this.counter = 0;
    }

    subscribe(receiver) {
        if (!this.hasValue) {
            console.log(this.constructor.name, "Rx, subscribe, no value, refreshing", this.counter);
            this.refresh();
        } else {
            console.log(this.constructor.name, "Rx, subscribe, immediate value", this.counter);
            receiver(this.value);
        }

        const listener = data => {
            switch (data.propertyName.toString()) {
                case HiddenProperty: {
                    receiver(data.value);
                    break;
                }
            }
        };

        this.addEventListener(Observable.propertyChangeEvent, listener);

        return {
            remove: () => {
                console.log(this.constructor.name, "Rx, removing", this.counter);
                this.removeEventListener(Observable.propertyChangeEvent, listener);
            },
        };
    }

    publish(value) {
        this.value = value;
        this.hasValue = true;
        this.counter++;
        console.log(this.constructor.name, "Rx, publishing new value", this.counter);
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
                console.log(this.constructor.name, "error", error);
            });
    }

    getValue() {
        return Promise.resolve(null);
    }
}

export function every(time, value) {
    const observable = new Observable();
    observable.notifyPropertyChange(HiddenProperty, value);
    setInterval(() => {
        observable.notifyPropertyChange(HiddenProperty, value);
    }, time);
    return observable;
}
