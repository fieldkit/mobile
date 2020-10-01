"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropDownModule = exports.SelectedIndexValueAccessor = void 0;
var core_1 = require("@angular/core");
var forms_1 = require("@angular/forms");
var element_registry_1 = require("nativescript-angular/element-registry");
var base_value_accessor_1 = require("nativescript-angular/forms/value-accessors/base-value-accessor");
element_registry_1.registerElement("DropDown", function () {
    return require("../drop-down").DropDown;
});
var SELECTED_INDEX_VALUE_ACCESSOR = {
    provide: forms_1.NG_VALUE_ACCESSOR,
    useExisting: core_1.forwardRef(function () {
        return SelectedIndexValueAccessor;
    }),
    multi: true,
};
var SelectedIndexValueAccessor = (function (_super) {
    __extends(SelectedIndexValueAccessor, _super);
    function SelectedIndexValueAccessor(elementRef) {
        var _this = _super.call(this, elementRef.nativeElement) || this;
        _this.onTouched = function () {};
        return _this;
    }
    SelectedIndexValueAccessor.prototype.selectedIndexChangeListener = function (event) {
        this.onChange(event.value);
    };
    SelectedIndexValueAccessor.prototype.writeValue = function (value) {
        if (value === undefined || value === null || value === "") {
            this._normalizedValue = null;
        } else {
            this._normalizedValue = value;
        }
        if (this.viewInitialized) {
            this.view.selectedIndex = this._normalizedValue;
        }
    };
    SelectedIndexValueAccessor.prototype.ngAfterViewInit = function () {
        this.viewInitialized = true;
        this.view.selectedIndex = this._normalizedValue;
    };
    SelectedIndexValueAccessor.prototype.registerOnTouched = function (fn) {
        this.onTouched = fn;
    };
    SelectedIndexValueAccessor.decorators = [
        {
            type: core_1.Directive,
            args: [
                {
                    selector:
                        "DropDown[ngModel], DropDown[formControl], DropDown[formControlName], dropDown[ngModel], dropDown[formControl], dropDown[formControlName], drop-down[ngModel], drop-down[formControl], drop-down[formControlName]",
                    providers: [SELECTED_INDEX_VALUE_ACCESSOR],
                },
            ],
        },
    ];
    SelectedIndexValueAccessor.ctorParameters = function () {
        return [{ type: core_1.ElementRef, decorators: [{ type: core_1.Inject, args: [core_1.ElementRef] }] }];
    };
    SelectedIndexValueAccessor.propDecorators = {
        selectedIndexChangeListener: [{ type: core_1.HostListener, args: ["selectedIndexChange", ["$event"]] }],
    };
    return SelectedIndexValueAccessor;
})(base_value_accessor_1.BaseValueAccessor);
exports.SelectedIndexValueAccessor = SelectedIndexValueAccessor;
var DropDownModule = (function () {
    function DropDownModule() {}
    DropDownModule.decorators = [
        {
            type: core_1.NgModule,
            args: [
                {
                    declarations: [SelectedIndexValueAccessor],
                    providers: [],
                    imports: [forms_1.FormsModule],
                    exports: [forms_1.FormsModule, SelectedIndexValueAccessor],
                },
            ],
        },
    ];
    return DropDownModule;
})();
exports.DropDownModule = DropDownModule;
