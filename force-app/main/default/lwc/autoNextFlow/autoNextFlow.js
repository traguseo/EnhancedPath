/**
 * @description       EnhancedPath
 * @author            Tyler | CRM Unity
 * @date              3/23/2026
 * @notes             Any notes / relevant updates to be aware of
 **/

import { LightningElement, api } from "lwc";
import { FlowNavigationNextEvent, FlowNavigationFinishEvent } from "lightning/flowSupport";

export default class AutoNavigateFlow extends LightningElement {
    @api availableActions = [];

    connectedCallback() {
        if (this.availableActions.includes("NEXT")) {
            this.dispatchEvent(new FlowNavigationNextEvent());
        } else if (this.availableActions.includes("FINISH")) {
            this.dispatchEvent(new FlowNavigationFinishEvent());
        }
    }
}
