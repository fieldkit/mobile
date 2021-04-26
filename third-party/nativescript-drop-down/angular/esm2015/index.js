import { Directive, ElementRef, HostListener, Inject, NgModule, forwardRef } from "@angular/core";
import { NG_VALUE_ACCESSOR, FormsModule } from "@angular/forms";
import { BaseValueAccessor, registerElement } from "@nativescript/angular";
import { DropDown } from "nativescript-drop-down";
import * as i0 from "@angular/core";
registerElement("DropDown", () => DropDown);
const SELECTED_INDEX_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectedIndexValueAccessor), multi: true
};
export class SelectedIndexValueAccessor extends BaseValueAccessor {
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
SelectedIndexValueAccessor.ɵfac = function SelectedIndexValueAccessor_Factory(t) { return new (t || SelectedIndexValueAccessor)(i0.ɵɵdirectiveInject(ElementRef)); };
SelectedIndexValueAccessor.ɵdir = i0.ɵɵdefineDirective({ type: SelectedIndexValueAccessor, selectors: [["DropDown", "ngModel", ""], ["DropDown", "formControl", ""], ["DropDown", "formControlName", ""], ["dropDown", "ngModel", ""], ["dropDown", "formControl", ""], ["dropDown", "formControlName", ""], ["drop-down", "ngModel", ""], ["drop-down", "formControl", ""], ["drop-down", "formControlName", ""]], hostBindings: function SelectedIndexValueAccessor_HostBindings(rf, ctx) { if (rf & 1) {
        i0.ɵɵlistener("selectedIndexChange", function SelectedIndexValueAccessor_selectedIndexChange_HostBindingHandler($event) { return ctx.selectedIndexChangeListener($event); });
    } }, features: [i0.ɵɵProvidersFeature([SELECTED_INDEX_VALUE_ACCESSOR]), i0.ɵɵInheritDefinitionFeature] });
(function () { i0.ɵsetClassMetadata(SelectedIndexValueAccessor, [{
        type: Directive,
        args: [{
                selector: "DropDown[ngModel], DropDown[formControl], DropDown[formControlName], dropDown[ngModel], dropDown[formControl], dropDown[formControlName], drop-down[ngModel], drop-down[formControl], drop-down[formControlName]",
                providers: [SELECTED_INDEX_VALUE_ACCESSOR]
            }]
    }], function () { return [{ type: i0.ElementRef, decorators: [{
                type: Inject,
                args: [ElementRef]
            }] }]; }, { selectedIndexChangeListener: [{
            type: HostListener,
            args: ["selectedIndexChange", ["$event"]]
        }] }); })();
export class DropDownModule {
}
DropDownModule.ɵmod = i0.ɵɵdefineNgModule({ type: DropDownModule });
DropDownModule.ɵinj = i0.ɵɵdefineInjector({ factory: function DropDownModule_Factory(t) { return new (t || DropDownModule)(); }, providers: [], imports: [[
            FormsModule
        ], FormsModule] });
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(DropDownModule, { declarations: [SelectedIndexValueAccessor], imports: [FormsModule], exports: [SelectedIndexValueAccessor, FormsModule] }); })();
(function () { i0.ɵsetClassMetadata(DropDownModule, [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiL2hvbWUvamxld2FsbGVuL2ZpZWxka2l0L05hdGl2ZVNjcmlwdC1Ecm9wLURvd24vYW5ndWxhci8iLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBaUIsU0FBUyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakgsT0FBTyxFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ2hFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUUzRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sd0JBQXdCLENBQUM7O0FBRWxELGVBQWUsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFNUMsTUFBTSw2QkFBNkIsR0FBRztJQUNwQyxPQUFPLEVBQUUsaUJBQWlCO0lBQzFCLFdBQVcsRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsMEJBQTBCLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSTtDQUN2RSxDQUFDO0FBa0JGLE1BQU0sT0FBTywwQkFBMkIsU0FBUSxpQkFBaUM7SUFLL0UsWUFBZ0MsVUFBc0I7UUFDcEQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQVMzQixjQUFTLEdBQUcsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBUjdCLENBQUM7SUFHTSwyQkFBMkIsQ0FBQyxLQUFVO1FBQzNDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFLTSxVQUFVLENBQUMsS0FBVTtRQUMxQixJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRSxFQUFFO1lBQ3pELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7U0FDOUI7YUFDSTtZQUNILElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7U0FDL0I7UUFFRCxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1NBQ2pEO0lBQ0gsQ0FBQztJQUVNLGVBQWU7UUFDcEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO0lBQ2xELENBQUM7SUFFTSxpQkFBaUIsQ0FBQyxFQUFjLElBQVUsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDOztvR0FuQzVELDBCQUEwQix1QkFLakIsVUFBVTsrREFMbkIsMEJBQTBCO3lJQUExQix1Q0FBbUM7MENBRm5DLENBQUMsNkJBQTZCLENBQUM7b0NBRS9CLDBCQUEwQjtjQUx0QyxTQUFTO2VBQUM7Z0JBRVQsUUFBUSxFQUFFLGtOQUFrTjtnQkFDNU4sU0FBUyxFQUFFLENBQUMsNkJBQTZCLENBQUM7YUFDM0M7O3NCQU1jLE1BQU07dUJBQUMsVUFBVTt3QkFLdkIsMkJBQTJCO2tCQURqQyxZQUFZO21CQUFDLHFCQUFxQixFQUFFLENBQUMsUUFBUSxDQUFDOztBQXdDakQsTUFBTSxPQUFPLGNBQWM7O2tEQUFkLGNBQWM7MkdBQWQsY0FBYyxtQkFUZCxFQUFFLFlBQ0o7WUFDUCxXQUFXO1NBQ1osRUFHQyxXQUFXO3dGQUdGLGNBQWMsbUJBakRkLDBCQUEwQixhQTBDbkMsV0FBVyxhQTFDRiwwQkFBMEIsRUE4Q25DLFdBQVc7b0NBR0YsY0FBYztjQVgxQixRQUFRO2VBQUM7Z0JBQ1IsWUFBWSxFQUFFLENBQUMsMEJBQTBCLENBQUM7Z0JBQzFDLFNBQVMsRUFBRSxFQUFFO2dCQUNiLE9BQU8sRUFBRTtvQkFDUCxXQUFXO2lCQUNaO2dCQUNELE9BQU8sRUFBRTtvQkFDUCwwQkFBMEI7b0JBQzFCLFdBQVc7aUJBQ1o7YUFDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFmdGVyVmlld0luaXQsIERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSG9zdExpc3RlbmVyLCBJbmplY3QsIE5nTW9kdWxlLCBmb3J3YXJkUmVmIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IE5HX1ZBTFVFX0FDQ0VTU09SLCBGb3Jtc01vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9mb3Jtc1wiO1xuaW1wb3J0IHsgQmFzZVZhbHVlQWNjZXNzb3IsIHJlZ2lzdGVyRWxlbWVudCB9IGZyb20gXCJAbmF0aXZlc2NyaXB0L2FuZ3VsYXJcIjtcbmltcG9ydCB7IFZpZXcgfSBmcm9tIFwiQG5hdGl2ZXNjcmlwdC9jb3JlXCI7XG5pbXBvcnQgeyBEcm9wRG93biB9IGZyb20gXCJuYXRpdmVzY3JpcHQtZHJvcC1kb3duXCI7XG5cbnJlZ2lzdGVyRWxlbWVudChcIkRyb3BEb3duXCIsICgpID0+IERyb3BEb3duKTtcblxuY29uc3QgU0VMRUNURURfSU5ERVhfVkFMVUVfQUNDRVNTT1IgPSB7XG4gIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxuICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBTZWxlY3RlZEluZGV4VmFsdWVBY2Nlc3NvciksIG11bHRpOiB0cnVlXG59O1xuXG5leHBvcnQgdHlwZSBTZWxlY3RhYmxlVmlldyA9IHsgc2VsZWN0ZWRJbmRleDogbnVtYmVyIH0gJiBWaWV3O1xuXG4vKipcbiAqIFRoZSBhY2Nlc3NvciBmb3Igc2V0dGluZyBhIHNlbGVjdGVkSW5kZXggYW5kIGxpc3RlbmluZyB0byBjaGFuZ2VzIHRoYXQgaXMgdXNlZCBieSB0aGVcbiAqIHtAbGluayBOZ01vZGVsfSBkaXJlY3RpdmVzLlxuICpcbiAqICAjIyMgRXhhbXBsZVxuICogIGBgYFxuICogIDxEcm9wRG93biBbKG5nTW9kZWwpXT1cIm1vZGVsLnRlc3RcIj5cbiAqICBgYGBcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTptYXgtbGluZS1sZW5ndGggZGlyZWN0aXZlLXNlbGVjdG9yXG4gIHNlbGVjdG9yOiBcIkRyb3BEb3duW25nTW9kZWxdLCBEcm9wRG93bltmb3JtQ29udHJvbF0sIERyb3BEb3duW2Zvcm1Db250cm9sTmFtZV0sIGRyb3BEb3duW25nTW9kZWxdLCBkcm9wRG93bltmb3JtQ29udHJvbF0sIGRyb3BEb3duW2Zvcm1Db250cm9sTmFtZV0sIGRyb3AtZG93bltuZ01vZGVsXSwgZHJvcC1kb3duW2Zvcm1Db250cm9sXSwgZHJvcC1kb3duW2Zvcm1Db250cm9sTmFtZV1cIixcbiAgcHJvdmlkZXJzOiBbU0VMRUNURURfSU5ERVhfVkFMVUVfQUNDRVNTT1JdXG59KVxuZXhwb3J0IGNsYXNzIFNlbGVjdGVkSW5kZXhWYWx1ZUFjY2Vzc29yIGV4dGVuZHMgQmFzZVZhbHVlQWNjZXNzb3I8U2VsZWN0YWJsZVZpZXc+IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCB7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bWF4LWxpbmUtbGVuZ3RoIGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcblxuICBwcml2YXRlIF9ub3JtYWxpemVkVmFsdWU6IG51bWJlcjtcbiAgcHJpdmF0ZSB2aWV3SW5pdGlhbGl6ZWQ6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChFbGVtZW50UmVmKSBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7XG4gICAgc3VwZXIoZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoXCJzZWxlY3RlZEluZGV4Q2hhbmdlXCIsIFtcIiRldmVudFwiXSlcbiAgcHVibGljIHNlbGVjdGVkSW5kZXhDaGFuZ2VMaXN0ZW5lcihldmVudDogYW55KSB7XG4gICAgdGhpcy5vbkNoYW5nZShldmVudC52YWx1ZSk7XG4gIH1cblxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tZW1wdHlcbiAgcHVibGljIG9uVG91Y2hlZCA9ICgpID0+IHsgfTtcblxuICBwdWJsaWMgd3JpdGVWYWx1ZSh2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IFwiXCIpIHtcbiAgICAgIHRoaXMuX25vcm1hbGl6ZWRWYWx1ZSA9IG51bGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5fbm9ybWFsaXplZFZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudmlld0luaXRpYWxpemVkKSB7XG4gICAgICB0aGlzLnZpZXcuc2VsZWN0ZWRJbmRleCA9IHRoaXMuX25vcm1hbGl6ZWRWYWx1ZTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIHRoaXMudmlld0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLnZpZXcuc2VsZWN0ZWRJbmRleCA9IHRoaXMuX25vcm1hbGl6ZWRWYWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyByZWdpc3Rlck9uVG91Y2hlZChmbjogKCkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLm9uVG91Y2hlZCA9IGZuOyB9XG59XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW1NlbGVjdGVkSW5kZXhWYWx1ZUFjY2Vzc29yXSxcbiAgcHJvdmlkZXJzOiBbXSxcbiAgaW1wb3J0czogW1xuICAgIEZvcm1zTW9kdWxlXG4gIF0sXG4gIGV4cG9ydHM6IFtcbiAgICBTZWxlY3RlZEluZGV4VmFsdWVBY2Nlc3NvcixcbiAgICBGb3Jtc01vZHVsZVxuICBdXG59KVxuZXhwb3J0IGNsYXNzIERyb3BEb3duTW9kdWxlIHtcbn1cbiJdfQ==