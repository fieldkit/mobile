import { CSSType, CoercibleProperty, ObservableArray, Property, Utils, View, addWeakEventListener, makeParser, makeValidator, removeWeakEventListener } from "@nativescript/core";
export { Length, Utils, backgroundColorProperty, colorProperty, fontInternalProperty, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty } from "@nativescript/core";
let DropDownBase = class DropDownBase extends View {
    _getItemAsString(index) {
        const items = this.items;
        if (!items) {
            return " ";
        }
        if (Utils.isNullOrUndefined(index)) {
            return null;
        }
        if (this.isValueListIn) {
            return items.getDisplay(index);
        }
        const item = this.isItemsSourceIn ? this.items.getItem(index) : this.items[index];
        return (item === undefined || item === null) ? index + "" : item + "";
    }
};
DropDownBase.openedEvent = "opened";
DropDownBase.closedEvent = "closed";
DropDownBase.selectedIndexChangedEvent = "selectedIndexChanged";
DropDownBase = __decorate([
    CSSType("DropDown")
], DropDownBase);
export { DropDownBase };
export class ValueList extends ObservableArray {
    getDisplay(index) {
        if (Utils.isNullOrUndefined(index)) {
            return null;
        }
        if (index < 0 || index >= this.length) {
            return "";
        }
        return this._array[index].display;
    }
    getValue(index) {
        if (Utils.isNullOrUndefined(index) || index < 0 || index >= this.length) {
            return null;
        }
        return this._array[index].value;
    }
    getIndex(value) {
        let loop;
        for (loop = 0; loop < this.length; loop++) {
            if (this.getValue(loop) === value) {
                return loop;
            }
        }
        return null;
    }
}
export const selectedIndexProperty = new CoercibleProperty({
    name: "selectedIndex",
    defaultValue: null,
    valueConverter: (v) => {
        if (v === undefined || v === null) {
            return null;
        }
        return parseInt(v, 10);
    },
    coerceValue: (target, value) => {
        const items = target.items;
        if (items && items.length !== 0) {
            const max = items.length - 1;
            if (value < 0) {
                value = 0;
            }
            if (value > max) {
                value = max;
            }
        }
        else {
            value = null;
        }
        return value;
    }
});
selectedIndexProperty.register(DropDownBase);
export const itemsProperty = new Property({
    name: "items",
    valueChanged: (target, oldValue, newValue) => {
        const getItem = newValue && newValue.getItem;
        const getDisplay = newValue && newValue.getDisplay;
        target.isItemsSourceIn = typeof getItem === "function";
        target.isValueListIn = typeof getDisplay === "function";
        if (oldValue instanceof ObservableArray) {
            removeWeakEventListener(oldValue, ObservableArray.changeEvent, target.refresh, target);
        }
        if (newValue instanceof ObservableArray) {
            addWeakEventListener(newValue, ObservableArray.changeEvent, target.refresh, target);
        }
    }
});
itemsProperty.register(DropDownBase);
export const hintProperty = new Property({
    name: "hint",
    defaultValue: ""
});
hintProperty.register(DropDownBase);
const textAlignmentConverter = makeParser(makeValidator("initial", "left", "center", "right"));
export const itemsTextAlignmentProperty = new Property({
    name: "itemsTextAlignment",
    defaultValue: "initial",
    valueConverter: textAlignmentConverter
});
itemsTextAlignmentProperty.register(DropDownBase);
export const itemsPaddingProperty = new Property({
    name: "itemsPadding",
    defaultValue: ""
});
itemsPaddingProperty.register(DropDownBase);
