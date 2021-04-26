import { AfterViewInit, ElementRef } from "@angular/core";
import { BaseValueAccessor } from "@nativescript/angular";
import { View } from "@nativescript/core";
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
export declare type SelectableView = {
    selectedIndex: number;
} & View;
export declare class SelectedIndexValueAccessor extends BaseValueAccessor<SelectableView> implements AfterViewInit {
    private _normalizedValue;
    private viewInitialized;
    constructor(elementRef: ElementRef);
    selectedIndexChangeListener(event: any): void;
    onTouched: () => void;
    writeValue(value: any): void;
    ngAfterViewInit(): void;
    registerOnTouched(fn: () => void): void;
    static ɵfac: i0.ɵɵFactoryDef<SelectedIndexValueAccessor, never>;
    static ɵdir: i0.ɵɵDirectiveDefWithMeta<SelectedIndexValueAccessor, "DropDown[ngModel], DropDown[formControl], DropDown[formControlName], dropDown[ngModel], dropDown[formControl], dropDown[formControlName], drop-down[ngModel], drop-down[formControl], drop-down[formControlName]", never, {}, {}, never>;
}
export declare class DropDownModule {
    static ɵmod: i0.ɵɵNgModuleDefWithMeta<DropDownModule, [typeof SelectedIndexValueAccessor], [typeof i1.FormsModule], [typeof SelectedIndexValueAccessor, typeof i1.FormsModule]>;
    static ɵinj: i0.ɵɵInjectorDef<DropDownModule>;
}
