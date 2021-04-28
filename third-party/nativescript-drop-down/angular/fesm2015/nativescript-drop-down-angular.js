import { forwardRef, ɵɵdirectiveInject, ElementRef, ɵɵdefineDirective, ɵɵlistener, ɵɵProvidersFeature, ɵɵInheritDefinitionFeature, ɵsetClassMetadata, Directive, Inject, HostListener, ɵɵdefineNgModule, ɵɵdefineInjector, ɵɵsetNgModuleScope, NgModule } from '@angular/core';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { registerElement, BaseValueAccessor } from '@nativescript/angular';
import { DropDown } from 'nativescript-drop-down';

registerElement("DropDown", () => DropDown);
const SELECTED_INDEX_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectedIndexValueAccessor), multi: true
};
class SelectedIndexValueAccessor extends BaseValueAccessor {
    constructor(elementRef) {
        super(elementRef.nativeElement);
        this.onTouched = () => { };
    }
    selectedIndexChangeListener(event) {
        this.onChange(event.value);
    }
    writeValue(value) {
        if (value === undefined || value === null || value === "") {
            this._normalizedValue = null;
        }
        else {
            this._normalizedValue = value;
        }
        if (this.viewInitialized) {
            this.view.selectedIndex = this._normalizedValue;
        }
    }
    ngAfterViewInit() {
        this.viewInitialized = true;
        this.view.selectedIndex = this._normalizedValue;
    }
    registerOnTouched(fn) { this.onTouched = fn; }
}
SelectedIndexValueAccessor.ɵfac = function SelectedIndexValueAccessor_Factory(t) { return new (t || SelectedIndexValueAccessor)(ɵɵdirectiveInject(ElementRef)); };
SelectedIndexValueAccessor.ɵdir = ɵɵdefineDirective({ type: SelectedIndexValueAccessor, selectors: [["DropDown", "ngModel", ""], ["DropDown", "formControl", ""], ["DropDown", "formControlName", ""], ["dropDown", "ngModel", ""], ["dropDown", "formControl", ""], ["dropDown", "formControlName", ""], ["drop-down", "ngModel", ""], ["drop-down", "formControl", ""], ["drop-down", "formControlName", ""]], hostBindings: function SelectedIndexValueAccessor_HostBindings(rf, ctx) { if (rf & 1) {
        ɵɵlistener("selectedIndexChange", function SelectedIndexValueAccessor_selectedIndexChange_HostBindingHandler($event) { return ctx.selectedIndexChangeListener($event); });
    } }, features: [ɵɵProvidersFeature([SELECTED_INDEX_VALUE_ACCESSOR]), ɵɵInheritDefinitionFeature] });
(function () { ɵsetClassMetadata(SelectedIndexValueAccessor, [{
        type: Directive,
        args: [{
                selector: "DropDown[ngModel], DropDown[formControl], DropDown[formControlName], dropDown[ngModel], dropDown[formControl], dropDown[formControlName], drop-down[ngModel], drop-down[formControl], drop-down[formControlName]",
                providers: [SELECTED_INDEX_VALUE_ACCESSOR]
            }]
    }], function () { return [{ type: ElementRef, decorators: [{
                type: Inject,
                args: [ElementRef]
            }] }]; }, { selectedIndexChangeListener: [{
            type: HostListener,
            args: ["selectedIndexChange", ["$event"]]
        }] }); })();
class DropDownModule {
}
DropDownModule.ɵmod = ɵɵdefineNgModule({ type: DropDownModule });
DropDownModule.ɵinj = ɵɵdefineInjector({ factory: function DropDownModule_Factory(t) { return new (t || DropDownModule)(); }, providers: [], imports: [[
            FormsModule
        ], FormsModule] });
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && ɵɵsetNgModuleScope(DropDownModule, { declarations: [SelectedIndexValueAccessor], imports: [FormsModule], exports: [SelectedIndexValueAccessor, FormsModule] }); })();
(function () { ɵsetClassMetadata(DropDownModule, [{
        type: NgModule,
        args: [{
                declarations: [SelectedIndexValueAccessor],
                providers: [],
                imports: [
                    FormsModule
                ],
                exports: [
                    SelectedIndexValueAccessor,
                    FormsModule
                ]
            }]
    }], null, null); })();

export { DropDownModule, SelectedIndexValueAccessor };
//# sourceMappingURL=nativescript-drop-down-angular.js.map
