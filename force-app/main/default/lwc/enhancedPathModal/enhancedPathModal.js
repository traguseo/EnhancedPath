/**
 * Created by Tyler on 7/13/2025.
 */

import { api } from "lwc";
import LightningModal from "lightning/modal";
import { updateRecord } from "lightning/uiRecordApi";

export default class EnhancedPathModal extends LightningModal {
    @api recordId;
    @api recordTypeId;
    @api objectApiName;
    @api fieldApiName;
    @api fieldLabel;
    @api flowApiName;
    @api flowInputVariables;
    @api dependentFields;
    @api selectedLabel;
    @api selectedValue;
    @api showDependentFields = false;
    @api showFlow = false;
    isLoading = true;

    handleFormLoaded(event) {
        this.isLoading = false;
    }

    handleFlowStatusChange(event) {
        console.log("ENHANCEDPATH-Flow status change event: ", event.detail.status);
        if (event.detail.status === "STARTED") {
            this.isLoading = false;
        } else if (event.detail.status === "ERROR") {
            this.close({ enhancedPathStatus: "error", error: event.detail });
        } else if (event.detail.status === "FINISHED" || event.detail.status === "FINISHED_SCREEN") {
            this.close({ enhancedPathStatus: "success" });
        }
    }

    handleRecordFormSubmit(event) {
        event.preventDefault();
        this.disableClose = true;
        this.isLoading = true;
        let fields = {};
        fields.Id = this.recordId;
        Object.entries(event.detail.fields).forEach(([key, value]) => {
            fields[key] = value;
        });
        console.log("ENHANCEDPATH-Submitting fields from dependent fields record edit form: ", fields);
        updateRecord({ fields })
            .then(() => {
                this.disableClose = false;
                this.close({ enhancedPathStatus: "success" });
            })
            .catch((error) => {
                this.disableClose = false;
                this.close({ enhancedPathStatus: "error", error });
            });
    }
}