import { Color } from "color";
import { placeholderColorProperty } from "ui/editable-text-base/editable-text-base-common";
import { Label } from "ui/label";
import { StackLayout } from "ui/layouts/stack-layout";
import { textAlignmentProperty, textDecorationProperty } from "ui/text-base";
import { backgroundColorProperty, colorProperty, fontInternalProperty, fontSizeProperty } from "ui/styling/style-properties";
import * as types from "utils/types";
import {
    DropDownBase,
    hintProperty,
    itemsPaddingProperty,
    itemsProperty,
    itemsTextAlignmentProperty,
    selectedIndexProperty,
} from "./drop-down-common";
export * from "./drop-down-common";
const LABELVIEWID = "spinner-label";
export var RealizedViewType;
(function (RealizedViewType) {
    RealizedViewType[(RealizedViewType["ItemView"] = 0)] = "ItemView";
    RealizedViewType[(RealizedViewType["DropDownView"] = 1)] = "DropDownView";
})(RealizedViewType || (RealizedViewType = {}));
export class DropDown extends DropDownBase {
    constructor() {
        super(...arguments);
        this._realizedItems = [new Map(), new Map()];
    }
    createNativeView() {
        initializeTNSSpinner();
        const spinner = new TNSSpinner(new WeakRef(this));
        if (!this._androidViewId) {
            this._androidViewId = android.view.View.generateViewId();
        }
        spinner.setId(this._androidViewId);
        initializeDropDownAdapter();
        const adapter = new DropDownAdapter(new WeakRef(this));
        spinner.setAdapter(adapter);
        spinner.adapter = adapter;
        initializeDropDownItemSelectedListener();
        const itemSelectedListener = new DropDownItemSelectedListener(new WeakRef(this));
        spinner.setOnItemSelectedListener(itemSelectedListener);
        spinner.itemSelectedListener = itemSelectedListener;
        return spinner;
    }
    initNativeView() {
        super.initNativeView();
        const nativeView = this.nativeView;
        nativeView.adapter.owner = new WeakRef(this);
        nativeView.itemSelectedListener.owner = new WeakRef(this);
        if (!types.isNullOrUndefined(this.selectedIndex)) {
            this.android.setSelection(this.selectedIndex + 1);
        }
        nativeView.itemsTextAlignment = itemsTextAlignmentProperty.defaultValue;
        nativeView.itemsPadding = itemsPaddingProperty.defaultValue;
    }
    disposeNativeView() {
        const nativeView = this.nativeView;
        nativeView.adapter.owner = null;
        nativeView.itemSelectedListener.owner = null;
        this._clearCache(RealizedViewType.DropDownView);
        this._clearCache(RealizedViewType.ItemView);
        super.disposeNativeView();
    }
    get android() {
        return this.nativeView;
    }
    open() {
        if (this.isEnabled) {
            this.nativeView.performClick();
        }
    }
    close() {
        this.nativeView.onDetachedFromWindowX();
    }
    refresh() {
        this._updateSelectedIndexOnItemsPropertyChanged(this.items);
        if (this.android && this.android.getAdapter()) {
            this.android.getAdapter().notifyDataSetChanged();
        }
        selectedIndexProperty.coerce(this);
    }
    [backgroundColorProperty.setNative](value) {
        this._propagateStylePropertyToRealizedViews("backgroundColor", value, true);
    }
    [colorProperty.setNative](value) {
        if (!types.isNullOrUndefined(value)) {
            this._propagateStylePropertyToRealizedViews("color", value, false);
        }
    }
    [fontInternalProperty.setNative](value) {
        this._propagateStylePropertyToRealizedViews("fontInternal", value, true);
    }
    [fontSizeProperty.setNative](value) {
        if (!types.isNullOrUndefined(value)) {
            this._propagateStylePropertyToRealizedViews("fontSize", value, true);
        }
    }
    [hintProperty.getDefault]() {
        return "";
    }
    [hintProperty.setNative](value) {
        this.android.getAdapter().notifyDataSetChanged();
    }
    [itemsPaddingProperty.getDefault]() {
        return "";
    }
    [itemsPaddingProperty.setNative](value) {
        this.nativeView.itemsPadding = value;
    }
    [itemsProperty.getDefault]() {
        return null;
    }
    [itemsProperty.setNative](value) {
        this._updateSelectedIndexOnItemsPropertyChanged(value);
        this.android.getAdapter().notifyDataSetChanged();
        selectedIndexProperty.coerce(this);
    }
    [itemsTextAlignmentProperty.getDefault]() {
        return "initial";
    }
    [itemsTextAlignmentProperty.setNative](value) {
        this.nativeView.itemsTextAlignment = value;
    }
    [textDecorationProperty.getDefault]() {
        return "none";
    }
    [textDecorationProperty.setNative](value) {
        this._propagateStylePropertyToRealizedViews("textDecoration", value, true);
    }
    [textAlignmentProperty.getDefault]() {
        return "left";
    }
    [textAlignmentProperty.setNative](value) {
        this._propagateStylePropertyToRealizedViews("textAlignment", value, true);
    }
    [placeholderColorProperty.setNative](value) {
        this._propagateStylePropertyToRealizedViews("placeholderColor", value, true);
    }
    [selectedIndexProperty.getDefault]() {
        return null;
    }
    [selectedIndexProperty.setNative](value) {
        const actualIndex = types.isNullOrUndefined(value) ? 0 : value + 1;
        this.nativeView.setSelection(actualIndex);
    }
    _getRealizedView(convertView, realizedViewType) {
        if (!convertView) {
            const view = new Label();
            const layout = new StackLayout();
            layout.style.horizontalAlignment = "stretch";
            view.id = LABELVIEWID;
            layout.addChild(view);
            return layout;
        }
        return this._realizedItems[realizedViewType].get(convertView);
    }
    _clearCache(realizedViewType) {
        const realizedItems = this._realizedItems[realizedViewType];
        realizedItems.forEach((view) => {
            if (view.parent) {
                view.parent._removeView(view);
            }
        });
        realizedItems.clear();
    }
    _propagateStylePropertyToRealizedViews(property, value, isIncludeHintIn = true) {
        const realizedItems = this._realizedItems;
        for (const item of realizedItems) {
            item.forEach((view) => {
                if (isIncludeHintIn || !view.isHintViewIn) {
                    if (
                        property === "textAlignment" ||
                        property === "textDecoration" ||
                        property === "fontInternal" ||
                        property === "fontSize" ||
                        property === "color" ||
                        property === "placeholderColor"
                    ) {
                        const label = view.getViewById(LABELVIEWID);
                        label.style[property] = value;
                    } else {
                        view.style[property] = value;
                    }
                }
            });
        }
    }
    _updateSelectedIndexOnItemsPropertyChanged(newItems) {
        let newItemsCount = 0;
        if (newItems && newItems.length) {
            newItemsCount = newItems.length;
        }
        if (newItemsCount === 0 || this.selectedIndex >= newItemsCount) {
            this.selectedIndex = null;
        }
    }
}
let TNSSpinner;
function initializeTNSSpinner() {
    if (TNSSpinner) {
        return;
    }
    var TNSSpinnerImpl = /** @class */ (function (_super) {
        __extends(TNSSpinnerImpl, _super);
        function TNSSpinnerImpl(owner) {
            var _this = _super.call(this, owner.get()._context) || this;
            _this.owner = owner;
            _this._isOpenedIn = false;
            return global.__native(_this);
        }
        Object.defineProperty(TNSSpinnerImpl.prototype, "itemsTextAlignment", {
            get: function () {
                return this._itemsTextAlignment;
            },
            set: function (value) {
                this._itemsTextAlignment = value;
            },
            enumerable: true,
            configurable: true,
        });
        Object.defineProperty(TNSSpinnerImpl.prototype, "itemsPadding", {
            get: function () {
                return this._itemsPadding;
            },
            set: function (value) {
                this._itemsPadding = value;
            },
            enumerable: true,
            configurable: true,
        });
        TNSSpinnerImpl.prototype.performClick = function () {
            var owner = this.owner.get();
            this._isOpenedIn = true;
            owner.notify({
                eventName: DropDownBase.openedEvent,
                object: owner,
            });
            return _super.prototype.performClick.call(this);
        };
        TNSSpinnerImpl.prototype.onWindowFocusChanged = function (hasWindowFocus) {
            _super.prototype.onWindowFocusChanged.call(this, hasWindowFocus);
            if (this._isOpenedIn && hasWindowFocus) {
                var owner = this.owner.get();
                owner.notify({
                    eventName: DropDownBase.closedEvent,
                    object: owner,
                });
                this._isOpenedIn = false;
            }
        };
        TNSSpinnerImpl.prototype.onDetachedFromWindowX = function () {
            _super.prototype.onDetachedFromWindow.call(this);
        };
        return TNSSpinnerImpl;
    })(android.widget.Spinner);
    TNSSpinner = TNSSpinnerImpl;
}
let DropDownAdapter;
function initializeDropDownAdapter() {
    if (DropDownAdapter) {
        return;
    }
    var DropDownAdapterImpl = /** @class */ (function (_super) {
        __extends(DropDownAdapterImpl, _super);
        function DropDownAdapterImpl(owner) {
            var _this = _super.call(this) || this;
            _this.owner = owner;
            return global.__native(_this);
        }
        DropDownAdapterImpl.prototype.isEnabled = function (i) {
            return i !== 0;
        };
        DropDownAdapterImpl.prototype.getCount = function () {
            // In some strange situations owner can become null (see #181)
            if (!this.owner) {
                return 0;
            }
            var owner = this.owner.get();
            return (owner && owner.items ? owner.items.length : 0) + 1; // +1 for the hint
        };
        DropDownAdapterImpl.prototype.getItem = function (i) {
            // In some strange situations owner can become null (see #181)
            if (!this.owner) {
                return "";
            }
            var owner = this.owner.get();
            if (i === 0) {
                return owner.hint;
            }
            var realIndex = i - 1;
            return owner._getItemAsString(realIndex);
        };
        DropDownAdapterImpl.prototype.getItemId = function (i) {
            return long(i);
        };
        DropDownAdapterImpl.prototype.hasStableIds = function () {
            return true;
        };
        DropDownAdapterImpl.prototype.getView = function (index, convertView, parent) {
            return this._generateView(index, convertView, parent, RealizedViewType.ItemView);
        };
        DropDownAdapterImpl.prototype.getDropDownView = function (index, convertView, parent) {
            return this._generateView(index, convertView, parent, RealizedViewType.DropDownView);
        };
        DropDownAdapterImpl.prototype._generateView = function (index, convertView, parent, realizedViewType) {
            // In some strange situations owner can become null (see #181)
            if (!this.owner) {
                return null;
            }
            var owner = this.owner.get();
            if (!owner) {
                return null;
            }
            var view = owner._getRealizedView(convertView, realizedViewType);
            if (view) {
                if (!view.parent) {
                    owner._addView(view);
                    convertView = view.android;
                }
                var label = view.getViewById(LABELVIEWID);
                label.text = this.getItem(index);
                // Copy root styles to view
                if (owner.style.color) {
                    label.style.color = owner.style.color;
                }
                if (owner.style.placeholderColor) {
                    label.style.placeholderColor = owner.style.placeholderColor;
                }
                label.style.textDecoration = owner.style.textDecoration;
                label.style.textAlignment =
                    owner.nativeView.itemsTextAlignment !== itemsTextAlignmentProperty.defaultValue && realizedViewType === 1
                        ? owner.nativeView.itemsTextAlignment
                        : owner.style.textAlignment;
                label.style.fontInternal = owner.style.fontInternal;
                if (owner.style.fontSize) {
                    label.style.fontSize = owner.style.fontSize;
                }
                view.style.backgroundColor = owner.style.backgroundColor;
                view.style.padding =
                    owner.nativeView.itemsPadding !== itemsPaddingProperty.defaultValue && realizedViewType === 1
                        ? owner.nativeView.itemsPadding
                        : owner.style.padding;
                view.style.height = owner.style.height;
                if (realizedViewType === RealizedViewType.DropDownView) {
                    view.style.opacity = owner.style.opacity;
                }
                view.isHintViewIn = false;
                // Hint View styles
                if (index === 0) {
                    if (label.style.placeholderColor) {
                        label.style.color = label.style.placeholderColor;
                    } else {
                        label.style.color = new Color(255, 148, 150, 148);
                    }
                    view.isHintViewIn = true;
                    // HACK: if there is no hint defined, make the view in the drop down virtually invisible.
                    if (realizedViewType === RealizedViewType.DropDownView && (types.isNullOrUndefined(owner.hint) || owner.hint === "")) {
                        view.height = 1;
                    }
                    // END HACK
                }
                owner._realizedItems[realizedViewType].set(convertView, view);
            }
            return convertView;
        };
        return DropDownAdapterImpl;
    })(android.widget.BaseAdapter);
    DropDownAdapter = DropDownAdapterImpl;
}
let DropDownItemSelectedListener;
function initializeDropDownItemSelectedListener() {
    if (DropDownItemSelectedListener) {
        return;
    }
    var DropDownItemSelectedListenerImpl = /** @class */ (function (_super) {
        __extends(DropDownItemSelectedListenerImpl, _super);
        function DropDownItemSelectedListenerImpl(owner) {
            var _this = _super.call(this) || this;
            _this.owner = owner;
            return global.__native(_this);
        }
        DropDownItemSelectedListenerImpl.prototype.onItemSelected = function (parent, convertView, index, id) {
            var owner = this.owner.get();
            var oldIndex = owner.selectedIndex;
            var newIndex = index === 0 ? null : index - 1;
            owner.selectedIndex = newIndex;
            if (newIndex !== oldIndex) {
                owner.notify({
                    eventName: DropDownBase.selectedIndexChangedEvent,
                    object: owner,
                    oldIndex: oldIndex,
                    newIndex: newIndex,
                });
                // Seems if the user does not select an item the control reuses the views on the next open.
                // So it should be safe to clear the cache once the user selects an item (and not when the dropdown is closed)
                owner._clearCache(RealizedViewType.DropDownView);
            }
        };
        DropDownItemSelectedListenerImpl.prototype.onNothingSelected = function () {
            /* Currently Not Needed */
        };
        DropDownItemSelectedListenerImpl = __decorate(
            [Interfaces([android.widget.AdapterView.OnItemSelectedListener])],
            DropDownItemSelectedListenerImpl
        );
        return DropDownItemSelectedListenerImpl;
    })(java.lang.Object);
    DropDownItemSelectedListener = DropDownItemSelectedListenerImpl;
}
