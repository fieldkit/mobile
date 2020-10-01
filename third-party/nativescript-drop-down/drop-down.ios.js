var TNSDropDownLabel_1;
import { Color } from "color";
import { placeholderColorProperty } from "ui/editable-text-base/editable-text-base-common";
import { Font } from "ui/styling/font";
import {
    backgroundColorProperty,
    colorProperty,
    fontInternalProperty,
    Length,
    paddingBottomProperty,
    paddingLeftProperty,
    paddingRightProperty,
    paddingTopProperty,
} from "ui/styling/style-properties";
import { letterSpacingProperty, textAlignmentProperty, textDecorationProperty, textTransformProperty } from "ui/text-base";
import * as types from "utils/types";
import { layout } from "utils/utils-common";
import {
    DropDownBase,
    hintProperty,
    itemsPaddingProperty,
    itemsProperty,
    itemsTextAlignmentProperty,
    selectedIndexProperty,
} from "./drop-down-common";
export * from "./drop-down-common";
const TOOLBAR_HEIGHT = 44;
const HINT_COLOR = new Color("#3904041E");
export class DropDown extends DropDownBase {
    createNativeView() {
        const dropDown = TNSDropDownLabel.initWithOwner(new WeakRef(this));
        dropDown.userInteractionEnabled = true;
        return dropDown;
    }
    initNativeView() {
        super.initNativeView();
        const nativeView = this.nativeViewProtected;
        const applicationFrame = UIApplication.sharedApplication.keyWindow.frame;
        this._listPicker = UIPickerView.alloc().init();
        this._dropDownDelegate = DropDownListPickerDelegateImpl.initWithOwner(new WeakRef(this));
        this._dropDownDataSource = DropDownListDataSource.initWithOwner(new WeakRef(this));
        this._flexToolbarSpace = UIBarButtonItem.alloc().initWithBarButtonSystemItemTargetAction(5, null, null);
        this._doneTapDelegate = TapHandler.initWithOwner(new WeakRef(this));
        this._doneButton = UIBarButtonItem.alloc().initWithBarButtonSystemItemTargetAction(0, this._doneTapDelegate, "tap");
        this._accessoryViewVisible = true;
        this._toolbar = UIToolbar.alloc().initWithFrame(CGRectMake(0, 0, applicationFrame.size.width, TOOLBAR_HEIGHT));
        this._toolbar.autoresizingMask = 2;
        const nsArray = NSMutableArray.alloc().init();
        nsArray.addObject(this._flexToolbarSpace);
        nsArray.addObject(this._doneButton);
        this._toolbar.setItemsAnimated(nsArray, false);
        nativeView.inputView = this._listPicker;
        this._accessoryViewVisible = true;
        this._showHideAccessoryView();
        nativeView.itemsTextAlignment = itemsTextAlignmentProperty.defaultValue;
        nativeView.itemsPadding = itemsPaddingProperty.defaultValue;
    }
    disposeNativeView() {
        this._doneTapDelegate = null;
        this._dropDownDelegate = null;
        this._dropDownDataSource = null;
        this.ios.inputView = null;
        this.ios.inputAccessoryView = null;
        this._listPicker = null;
        this._toolbar = null;
        this._doneButton = null;
        super.disposeNativeView();
    }
    get ios() {
        return this.nativeViewProtected;
    }
    get accessoryViewVisible() {
        return this._accessoryViewVisible;
    }
    set accessoryViewVisible(value) {
        this._accessoryViewVisible = value;
        this._showHideAccessoryView();
    }
    onLoaded() {
        super.onLoaded();
        this._listPicker.delegate = this._dropDownDelegate;
        this._listPicker.dataSource = this._dropDownDataSource;
    }
    onUnloaded() {
        this._listPicker.delegate = null;
        this._listPicker.dataSource = null;
        super.onUnloaded();
    }
    open() {
        if (this.isEnabled) {
            this.ios.becomeFirstResponder();
        }
    }
    close() {
        this.ios.resignFirstResponder();
    }
    refresh() {
        if (!this._listPicker) {
            return;
        }
        this._listPicker.reloadAllComponents();
        selectedIndexProperty.coerce(this);
    }
    [selectedIndexProperty.getDefault]() {
        return null;
    }
    [selectedIndexProperty.setNative](value) {
        if (value >= 0) {
            setTimeout(() => {
                this._listPicker.selectRowInComponentAnimated(value, 0, true);
            }, 1);
        }
        this.ios.setText(this._getItemAsString(value));
    }
    [itemsProperty.getDefault]() {
        return null;
    }
    [itemsProperty.setNative](value) {
        this.refresh();
    }
    [hintProperty.getDefault]() {
        return "";
    }
    [hintProperty.setNative](value) {
        this.ios.hint = value;
    }
    [itemsTextAlignmentProperty.getDefault]() {
        return "initial";
    }
    [itemsTextAlignmentProperty.setNative](value) {
        this.nativeView.itemsTextAlignment = value;
    }
    [itemsPaddingProperty.getDefault]() {
        return "";
    }
    [itemsPaddingProperty.setNative](value) {
        this.nativeView.itemsPadding = value;
    }
    [colorProperty.getDefault]() {
        return this.nativeView.color;
    }
    [colorProperty.setNative](value) {
        const color = value instanceof Color ? value.ios : value;
        this.nativeView.color = color;
        this._listPicker.tintColor = color;
        this._listPicker.reloadAllComponents();
    }
    [placeholderColorProperty.getDefault]() {
        return this.nativeView.placeholderColor;
    }
    [placeholderColorProperty.setNative](value) {
        const color = value instanceof Color ? value.ios : value;
        this.nativeView.placeholderColor = color;
    }
    [backgroundColorProperty.getDefault]() {
        return this.nativeView.backgroundColor;
    }
    [backgroundColorProperty.setNative](value) {
        if (!value) {
            return;
        }
        const color = value instanceof Color ? value.ios : value;
        this.nativeView.backgroundColor = color;
        this._listPicker.backgroundColor = color;
        this._listPicker.reloadAllComponents();
    }
    [fontInternalProperty.getDefault]() {
        return this.nativeView.font;
    }
    [fontInternalProperty.setNative](value) {
        const font = value instanceof Font ? value.getUIFont(this.nativeView.font) : value;
        this.nativeView.font = font;
    }
    [textAlignmentProperty.setNative](value) {
        switch (value) {
            case "initial":
            case "left":
                this.nativeView.textAlignment = 0;
                break;
            case "center":
                this.nativeView.textAlignment = 1;
                break;
            case "right":
                this.nativeView.textAlignment = 2;
                break;
        }
    }
    [textDecorationProperty.setNative](value) {
        _setTextAttributes(this.nativeView, this.style);
    }
    [textTransformProperty.setNative](value) {
        _setTextAttributes(this.nativeView, this.style);
    }
    [letterSpacingProperty.setNative](value) {
        _setTextAttributes(this.nativeView, this.style);
    }
    [paddingTopProperty.setNative](value) {
        this._setPadding({
            top: layout.toDeviceIndependentPixels(this.effectivePaddingTop),
        });
    }
    [paddingRightProperty.setNative](value) {
        this._setPadding({
            right: layout.toDeviceIndependentPixels(this.effectivePaddingRight),
        });
    }
    [paddingBottomProperty.setNative](value) {
        this._setPadding({
            bottom: layout.toDeviceIndependentPixels(this.effectivePaddingBottom),
        });
    }
    [paddingLeftProperty.setNative](value) {
        this._setPadding({
            left: layout.toDeviceIndependentPixels(this.effectivePaddingLeft),
        });
    }
    _setPadding(newPadding) {
        const nativeView = this.nativeView;
        const padding = nativeView.padding;
        nativeView.padding = Object.assign(padding, newPadding);
    }
    _showHideAccessoryView() {
        this.ios.inputAccessoryView = this._accessoryViewVisible ? this._toolbar : null;
    }
}
var TapHandler = /** @class */ (function (_super) {
    __extends(TapHandler, _super);
    function TapHandler() {
        return (_super !== null && _super.apply(this, arguments)) || this;
    }
    TapHandler_1 = TapHandler;
    TapHandler.initWithOwner = function (owner) {
        var tapHandler = TapHandler_1.new();
        tapHandler._owner = owner;
        return tapHandler;
    };
    TapHandler.prototype.tap = function () {
        this._owner.get().close();
    };
    var TapHandler_1;
    __decorate([ObjCMethod()], TapHandler.prototype, "tap", null);
    TapHandler = TapHandler_1 = __decorate([ObjCClass()], TapHandler);
    return TapHandler;
})(NSObject);
var DropDownListDataSource = /** @class */ (function (_super) {
    __extends(DropDownListDataSource, _super);
    function DropDownListDataSource() {
        return (_super !== null && _super.apply(this, arguments)) || this;
    }
    DropDownListDataSource_1 = DropDownListDataSource;
    DropDownListDataSource.initWithOwner = function (owner) {
        var dataSource = DropDownListDataSource_1.new();
        dataSource._owner = owner;
        return dataSource;
    };
    DropDownListDataSource.prototype.numberOfComponentsInPickerView = function (pickerView) {
        return 1;
    };
    DropDownListDataSource.prototype.pickerViewNumberOfRowsInComponent = function (pickerView, component) {
        var owner = this._owner.get();
        return owner && owner.items ? owner.items.length : 0;
    };
    var DropDownListDataSource_1;
    DropDownListDataSource = DropDownListDataSource_1 = __decorate([ObjCClass(UIPickerViewDataSource)], DropDownListDataSource);
    return DropDownListDataSource;
})(NSObject);
var DropDownListPickerDelegateImpl = /** @class */ (function (_super) {
    __extends(DropDownListPickerDelegateImpl, _super);
    function DropDownListPickerDelegateImpl() {
        return (_super !== null && _super.apply(this, arguments)) || this;
    }
    DropDownListPickerDelegateImpl_1 = DropDownListPickerDelegateImpl;
    DropDownListPickerDelegateImpl.initWithOwner = function (owner) {
        var delegate = DropDownListPickerDelegateImpl_1.new();
        delegate._owner = owner;
        return delegate;
    };
    DropDownListPickerDelegateImpl.prototype.pickerViewViewForRowForComponentReusingView = function (pickerView, row, component, view) {
        // NOTE: Currently iOS sends the reusedView always as null, so no reusing is possible
        var owner = this._owner.get();
        var style = owner.style;
        var label = TNSLabel.alloc().init();
        label.text = owner._getItemAsString(row);
        // Copy Styles
        if (style.color) {
            label.textColor = style.color.ios;
        }
        var itemsPaddingTop;
        var itemsPaddingRight;
        var itemsPaddingBottom;
        var itemsPaddingLeft;
        if (owner.nativeView.itemsPadding !== itemsPaddingProperty.defaultValue) {
            var itemsPadding = owner.nativeView.itemsPadding.split(/[ ,]+/).map(function (s) {
                return Length.parse(s);
            });
            if (itemsPadding.length === 1) {
                itemsPaddingTop = itemsPadding[0];
                itemsPaddingRight = itemsPadding[0];
                itemsPaddingBottom = itemsPadding[0];
                itemsPaddingLeft = itemsPadding[0];
            } else if (itemsPadding.length === 2) {
                itemsPaddingTop = itemsPadding[0];
                itemsPaddingRight = itemsPadding[1];
                itemsPaddingBottom = itemsPadding[0];
                itemsPaddingLeft = itemsPadding[1];
            } else if (itemsPadding.length === 3) {
                itemsPaddingTop = itemsPadding[0];
                itemsPaddingRight = itemsPadding[1];
                itemsPaddingBottom = itemsPadding[2];
                itemsPaddingLeft = itemsPadding[1];
            } else if (itemsPadding.length === 4) {
                itemsPaddingTop = itemsPadding[0];
                itemsPaddingRight = itemsPadding[1];
                itemsPaddingBottom = itemsPadding[2];
                itemsPaddingLeft = itemsPadding[3];
            }
        } else {
            itemsPaddingTop = owner.effectivePaddingTop;
            itemsPaddingRight = owner.effectivePaddingRight;
            itemsPaddingBottom = owner.effectivePaddingBottom;
            itemsPaddingLeft = owner.effectivePaddingLeft;
        }
        label.padding = {
            top: Length.toDevicePixels(itemsPaddingTop, 0),
            right: Length.toDevicePixels(itemsPaddingRight, 0),
            bottom: Length.toDevicePixels(itemsPaddingBottom, 0),
            left: Length.toDevicePixels(itemsPaddingLeft, 0),
        };
        label.font = style.fontInternal.getUIFont(label.font);
        var itemsTextAlignment =
            owner.nativeView.itemsTextAlignment === itemsTextAlignmentProperty.defaultValue
                ? style.textAlignment
                : owner.nativeView.itemsTextAlignment;
        switch (itemsTextAlignment) {
            case "initial":
            case "left":
                label.textAlignment = NSTextAlignment.Left;
                break;
            case "center":
                label.textAlignment = NSTextAlignment.Center;
                break;
            case "right":
                label.textAlignment = NSTextAlignment.Right;
                break;
        }
        _setTextAttributes(label, style);
        return label;
    };
    DropDownListPickerDelegateImpl.prototype.pickerViewDidSelectRowInComponent = function (pickerView, row, component) {
        var owner = this._owner.get();
        if (owner) {
            var oldIndex = owner.selectedIndex;
            owner.selectedIndex = row;
            if (row !== oldIndex) {
                owner.notify({
                    eventName: DropDownBase.selectedIndexChangedEvent,
                    object: owner,
                    oldIndex: oldIndex,
                    newIndex: row,
                });
            }
        }
    };
    var DropDownListPickerDelegateImpl_1;
    DropDownListPickerDelegateImpl = DropDownListPickerDelegateImpl_1 = __decorate(
        [ObjCClass(UIPickerViewDelegate)],
        DropDownListPickerDelegateImpl
    );
    return DropDownListPickerDelegateImpl;
})(NSObject);
let TNSDropDownLabel = (TNSDropDownLabel_1 = class TNSDropDownLabel extends TNSLabel {
    static initWithOwner(owner) {
        const label = TNSDropDownLabel_1.new();
        label._owner = owner;
        label._isInputViewOpened = false;
        label.color = UIColor.blackColor;
        label.placeholderColor = HINT_COLOR.ios;
        label.text = " ";
        label.addGestureRecognizer(UITapGestureRecognizer.alloc().initWithTargetAction(label, "tap"));
        return label;
    }
    get inputView() {
        return this._inputView;
    }
    set inputView(value) {
        this._inputView = value;
    }
    get inputAccessoryView() {
        return this._inputAccessoryView;
    }
    set inputAccessoryView(value) {
        this._inputAccessoryView = value;
    }
    get canBecomeFirstResponder() {
        return true;
    }
    get canResignFirstResponder() {
        return true;
    }
    get hint() {
        return this._hint;
    }
    set hint(value) {
        const owner = this._owner.get();
        this._hint = value;
        if (!this._hasText) {
            this.text = value;
            _setTextAttributes(owner.nativeView, owner.style);
        }
    }
    get color() {
        return this._internalColor;
    }
    set color(value) {
        this._internalColor = value;
        this._refreshColor();
    }
    get placeholderColor() {
        return this._internalPlaceholderColor;
    }
    set placeholderColor(value) {
        this._internalPlaceholderColor = value;
        this._refreshColor();
    }
    setText(value) {
        const actualText = value || this._hint || "";
        const owner = this._owner.get();
        this._hasText = !types.isNullOrUndefined(value) && value !== "";
        this.text = actualText === "" ? " " : actualText;
        this._refreshColor();
        _setTextAttributes(owner.nativeView, owner.style);
    }
    get itemsTextAlignment() {
        return this._itemsTextAlignment;
    }
    set itemsTextAlignment(value) {
        this._itemsTextAlignment = value;
    }
    get itemsPadding() {
        return this._itemsPadding;
    }
    set itemsPadding(value) {
        this._itemsPadding = value;
    }
    becomeFirstResponder() {
        const result = super.becomeFirstResponder();
        if (result) {
            if (!this._isInputViewOpened) {
                const owner = this._owner.get();
                owner.notify({
                    eventName: DropDownBase.openedEvent,
                    object: owner,
                });
            }
            this._isInputViewOpened = true;
        }
        return result;
    }
    resignFirstResponder() {
        const result = super.resignFirstResponder();
        const owner = this._owner.get();
        if (result) {
            this._isInputViewOpened = false;
            owner.notify({
                eventName: DropDownBase.closedEvent,
                object: owner,
            });
        }
        return result;
    }
    tap(sender) {
        if (sender.state === 3) {
            const owner = this._owner.get();
            if (owner.isEnabled) {
                this.becomeFirstResponder();
            }
        }
    }
    _refreshColor() {
        this.textColor = this._hasText ? this._internalColor : this._internalPlaceholderColor;
    }
});
__decorate([ObjCMethod(), __param(0, ObjCParam(UITapGestureRecognizer))], TNSDropDownLabel.prototype, "tap", null);
TNSDropDownLabel = TNSDropDownLabel_1 = __decorate([ObjCClass()], TNSDropDownLabel);
function _setTextAttributes(nativeView, style) {
    const attributes = new Map();
    switch (style.textDecoration) {
        case "none":
            break;
        case "underline":
            attributes.set(NSUnderlineStyleAttributeName, 1);
            break;
        case "line-through":
            attributes.set(NSStrikethroughStyleAttributeName, 1);
            break;
        case "underline line-through":
            attributes.set(NSUnderlineStyleAttributeName, 1);
            attributes.set(NSStrikethroughStyleAttributeName, 1);
            break;
    }
    if (style.letterSpacing !== 0) {
        attributes.set(NSKernAttributeName, style.letterSpacing * nativeView.font.pointSize);
    }
    if (nativeView.textColor && attributes.size > 0) {
        attributes.set(NSForegroundColorAttributeName, nativeView.textColor);
    }
    const text = types.isNullOrUndefined(nativeView.text) ? "" : nativeView.text.toString();
    let sourceString;
    switch (style.textTransform) {
        case "uppercase":
            sourceString = NSString.stringWithString(text).uppercaseString;
            break;
        case "lowercase":
            sourceString = NSString.stringWithString(text).lowercaseString;
            break;
        case "capitalize":
            sourceString = NSString.stringWithString(text).capitalizedString;
            break;
        default:
            sourceString = text;
    }
    if (attributes.size > 0) {
        const result = NSMutableAttributedString.alloc().initWithString(sourceString);
        result.setAttributesRange(attributes, {
            location: 0,
            length: sourceString.length,
        });
        nativeView.attributedText = result;
    } else {
        nativeView.attributedText = undefined;
        nativeView.text = sourceString;
    }
}
