/**
 *
 * Created by Tyler on 7/8/2025.
 */

import { LightningElement, api, wire } from "lwc";
import { getObjectInfo, getPicklistValues, getPicklistValuesByRecordType } from "lightning/uiObjectInfoApi";
import { getRecord, updateRecord } from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import formFactor from "@salesforce/client/formFactor";
import getPathAssistantSteps from "@salesforce/apex/EnhancedPathController.getPathAssistantSteps";
import modal from "c/enhancedPathModal";

export default class EnhancedPath extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api fieldApiName;
    pathSteps = [];
    isSaving = false;
    showFlow = false;
    showDependentFields = false;
    disablePath = false;
    preventOverwriteSelectedValue = false;
    rerenderKeyFields = false;
    picklistValues = [];
    dependentFields = [];
    recordTypeId = "";
    recordTypeName = "";
    selectedValue = "";
    currentValue = "";
    selectedLabel = "";
    objectInfo = {};
    resolvedDependenciesByPicklistValue = {}; // Final output: { [controllingValue]: [dependentFieldNames...] }

    renderedCallback() {
        //to scroll the starting value into view
        if (this.picklistValues && this.selectedValue) {
            const startingValueElement = this.template.querySelector(
                `.slds-path__link[data-value="${this.selectedValue}"]`
            );
            if (startingValueElement) {
                startingValueElement.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }
        }
    }

    @wire(getRecord, {
        recordId: "$recordId",
        fields: "$fields"
    })
    handleRecordData({ data, error }) {
        if (data) {
            console.log("ENHANCEDPATH-Current Record Data: ", data);
            this.currentValue = data.fields[this.fieldApiName].value;
            if (!this.preventOverwriteSelectedValue) {
                this.selectedValue = this.currentValue;
                this.selectedLabel = data.fields[this.fieldApiName].displayValue;
            }
            this.recordTypeId = data.recordTypeId;
            this.recordTypeName = data.recordTypeInfo ? data.recordTypeInfo.name : "__MASTER__";
            this.preventOverwriteSelectedValue = false;
        } else if (error) {
            this._logErrorNoToast("Error handling wired record data", error);
        }
    }

    @wire(getPathAssistantSteps, {
        recordTypeName: "$recordTypeName",
        objectApiName: "$objectApiName",
        fieldApiName: "$fieldApiName"
    })
    handlePathSteps({ data, error }) {
        if (data) {
            console.log("ENHANCEDPATH-Path Steps Metadata: ", data);
            this.pathSteps = data;
        } else if (error) {
            this._logErrorNoToast("Error handling wired PathAssistant metadata steps", error);
        }
    }

    @wire(getObjectInfo, { objectApiName: "$objectApiName" })
    handleObjectInfo({ data, error }) {
        if (data) {
            this.objectInfo = data;
            console.log("ENHANCEDPATH-Object Info: ", this.objectInfo);
            if (this.objectInfo.dependentFields) {
                this.dependentFields = this.objectInfo.dependentFields[this.fieldApiName] || {};
                console.log(
                    `ENHANCEDPATH-Natively defined dependencies on ${this.fieldApiName} (including nested dependencies):`,
                    this.dependentFields
                );
            }
        } else if (error) {
            this._logErrorNoToast(`Error getting object info for ${this.objectApiName}`, error);
        }
    }

    @wire(getPicklistValues, {
        recordTypeId: "$recordTypeId",
        fieldApiName: "$computedFieldApiName"
    })
    handlePicklistValues({ data, error }) {
        if (data) {
            console.log(
                `ENHANCEDPATH-Picklist Values for field: ${this.fieldApiName} on record type: ${this.recordTypeName}-${this.recordTypeId}`,
                data
            );
            this.picklistValues = data.values;
        } else if (error) {
            this._logErrorNoToast(
                `Error getting picklist values for ${this.computedFieldApiName} on record type: ${this.recordTypeName}-${this.recordTypeId}`,
                error
            );
        }
    }

    @wire(getPicklistValuesByRecordType, {
        objectApiName: "$objectApiName",
        recordTypeId: "$recordTypeId"
    })
    handlePicklistValuesByRecordType({ data, error }) {
        if (data) {
            console.log(
                `ENHANCEDPATH-Picklist Values for all fields for record type: ${this.recordTypeName}-${this.recordTypeId}`,
                data
            );
            this.objectPicklistData = data;
            this.resolvedDependenciesByPicklistValue = this._resolveFilteredDependentFields();
        } else if (error) {
            this._logErrorNoToast(
                `Error getting picklist values by record type for ${this.objectApiName} with record type ${this.recordTypeId}`,
                error
            );
        }
    }

    get fields() {
        return [this.computedFieldApiName];
    }

    get fieldLabel() {
        if (this.objectInfo && this.objectInfo.fields && this.objectInfo.fields[this.fieldApiName]) {
            return this.objectInfo.fields[this.fieldApiName].label;
        }
        return "";
    }

    get displayedStepsWithClass() {
        if (!this.picklistValues) return [];
        return this.picklistValues.map((step) => {
            let classes = "slds-path__item";
            let isComplete = false;
            let isIncomplete = true;
            let isCurrent = false;
            if (step.value === this.currentValue) {
                classes += " slds-is-current";
                if (step.value === this.selectedValue) {
                    classes += " slds-is-active";
                }
                isCurrent = true;
            } else if (step.value === this.selectedValue) {
                classes += " slds-is-active";
            } else if (this.isCompleted(step.value)) {
                classes += " slds-is-complete";
                isComplete = true;
                isIncomplete = false;
            } else {
                classes += " slds-is-incomplete";
                isIncomplete = true;
            }
            return { ...step, stepClass: classes, isComplete, isCurrent, isIncomplete };
        });
    }

    get computedFieldApiName() {
        return `${this.objectApiName}.${this.fieldApiName}`;
    }

    get selectedValuePathStep() {
        return (this.pathSteps || []).find((step) => step.value === this.selectedValue);
    }

    get buttonLabel() {
        return this.selectedValue === this.currentValue
            ? `Mark ${this.fieldLabel} as Complete`
            : `Mark as Current ${this.fieldLabel}`;
    }

    get disableCompleteButton() {
        const idx = this.picklistValues.findIndex(
            (step) => step.value === this.currentValue && step.value === this.selectedValue
        );
        return idx === this.picklistValues.length - 1;
    }

    get completeButtonIconName() {
        return this.buttonLabel === `Mark ${this.fieldLabel} as Complete` ? "utility:check" : "";
    }

    get flowInputVariables() {
        return [
            { name: "recordId", type: "String", value: this.recordId },
            { name: "objectApiName", type: "String", value: this.objectApiName },
            { name: "fieldApiName", type: "String", value: this.fieldApiName },
            { name: "oldValue", type: "String", value: this.currentValue },
            { name: "newValue", type: "String", value: this.selectedValue }
        ];
    }

    get selectedValueDependentFields() {
        if (!this.resolvedDependenciesByPicklistValue || !this.selectedValue) return [];
        const fieldsSet = this.resolvedDependenciesByPicklistValue[this.selectedValue];
        if (!fieldsSet) return [];
        return Array.from(fieldsSet);
    }

    get pathDisabledClass() {
        return this.disablePath ? "path-disabled" : "";
    }

    get showCoachingPanel() {
        return (
            this.selectedValuePathStep &&
            (this.selectedValuePathStep.guidance || this.selectedValuePathStep.keyFields.length > 0)
        );
    }

    get showKeyFields() {
        return this.selectedValuePathStep && this.selectedValuePathStep.keyFields.length > 0 && !this.rerenderKeyFields;
    }

    get showGuidance() {
        return this.selectedValuePathStep && this.selectedValuePathStep.guidance;
    }

    get rightSideCoachingPanelLargeDeviceColumnSize() {
        return this.showKeyFields ? 6 : 12;
    }

    get leftSideCoachingPanelLargeDeviceColumnSize() {
        return this.showGuidance ? 6 : 12;
    }

    get showSpinner() {
        return this.isSaving || !this.displayedStepsWithClass.length;
    }

    isCompleted(value) {
        if (!this.picklistValues || !this.currentValue) return false;
        const currentIdx = this.picklistValues.findIndex((step) => step.value === this.currentValue);
        const stepIdx = this.picklistValues.findIndex((step) => step.value === value);
        return stepIdx < currentIdx;
    }

    handleStageClick(event) {
        event.preventDefault();
        event.currentTarget.blur();
        this.selectedValue = event.currentTarget.dataset.value;
        this.selectedLabel = event.currentTarget.dataset.label;
        const link = event.currentTarget;
        link.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }

    handleMarkComplete() {
        this.isSaving = true;
        if (this.currentValue === this.selectedValue) {
            const currentIndex = this.picklistValues.findIndex((step) => step.value === this.currentValue);
            if (currentIndex < this.picklistValues.length - 1) {
                this.selectedValue = this.picklistValues[currentIndex + 1].value;
                this.selectedLabel = this.picklistValues[currentIndex + 1].label;
            }
        }
        this.showFlow = this.selectedValuePathStep && this.selectedValuePathStep.runFlow;
        if (this.showFlow) {
            if (this.selectedValuePathStep.flowValid) {
                this._sendToast(
                    "Action Required",
                    `Moving the ${this.fieldLabel} to ${this.selectedLabel} requires additional steps!`,
                    "info"
                );
                this.isSaving = false;
                this.disablePath = true;
                this._openModal({
                    label: "Enhanced Path Modal",
                    size: formFactor === "Large" ? "large" : "full",
                    description: `Action Required: Moving the ${this.fieldLabel} to ${this.selectedLabel} requires additional steps!`,
                    recordId: this.recordId,
                    recordTypeId: this.recordTypeId,
                    objectApiName: this.objectApiName,
                    fieldApiName: this.fieldApiName,
                    fieldLabel: this.fieldLabel,
                    flowApiName: this.selectedValuePathStep.flowApiName,
                    flowInputVariables: this.flowInputVariables,
                    selectedLabel: this.selectedLabel,
                    selectedValue: this.selectedValue,
                    showDependentFields: this.showDependentFields,
                    showFlow: this.showFlow
                });
            } else {
                this._logErrorAndToast(
                    "Flow configuration invalid!",
                    `The flow API name designated for this step could not be found amongst active screen flows. Please contact your system administrator, as this means the configuration for the ${this.selectedValue} value on the ${this.fieldApiName} picklist field on the ${this.objectApiName} object is not valid and will prevent users from updating to this value.`,
                    "error",
                    `The flow API name designated for this step could not be found amongst active screen flows. Please contact your system administrator, as this means the configuration for the ${this.selectedValue} value on the ${this.fieldApiName} picklist field on the ${this.objectApiName} object is not valid and will prevent users from updating to this value.`
                );
                this.isSaving = false;
                this.disablePath = false;
            }
        } else if (this.selectedValueDependentFields && this.selectedValueDependentFields.length > 0) {
            this._sendToast(
                "Action Required",
                `Moving the ${this.fieldLabel} to ${this.selectedLabel} requires additional steps!`,
                "info"
            );
            console.log(
                "ENHANCEDPATH-Dependent fields detected, showing record edit form with fields: ",
                this.selectedValueDependentFields
            );
            this.showDependentFields = true;
            this.isSaving = false;
            this.disablePath = true;
            this._openModal({
                label: "Enhanced Path Modal",
                size: formFactor === "Large" ? "large" : "full",
                description: `Action Required: Moving the ${this.fieldLabel} to ${this.selectedLabel} requires additional steps!`,
                recordId: this.recordId,
                recordTypeId: this.recordTypeId,
                objectApiName: this.objectApiName,
                fieldApiName: this.fieldApiName,
                fieldLabel: this.fieldLabel,
                dependentFields: this.selectedValueDependentFields,
                selectedLabel: this.selectedLabel,
                selectedValue: this.selectedValue,
                showDependentFields: this.showDependentFields,
                showFlow: this.showFlow
            });
        } else {
            console.log("ENHANCEDPATH-No flow or dependent fields required, saving directly.");
            this.handleSaveFromButton();
        }
    }

    handleSaveFromButton() {
        let fields = {};
        fields.Id = this.recordId;
        fields[this.fieldApiName] = this.selectedValue;
        console.log("ENHANCEDPATH-Updating record with fields: ", fields);
        updateRecord({ fields })
            .then(() => {
                this.currentValue = this.selectedValue;
                this._sendToast(
                    "Success",
                    `${this.fieldLabel} successfully updated to ${this.selectedLabel}!`,
                    "success"
                );
            })
            .catch((error) => {
                this._logErrorAndToast(
                    `Error updating ${this.fieldLabel} to ${this.selectedLabel}!`,
                    this._labelErrorsWithNumbers(this._reduceErrors(error)),
                    "error",
                    error
                );
            })
            .finally(() => {
                this.isSaving = false;
                this.disablePath = false;
            });
    }

    handleRecordFormSubmit(event) {
        event.preventDefault();
        this.isSaving = true;
        this.disablePath = true;
        let fields = {};
        fields.Id = this.recordId;
        Object.entries(event.detail.fields).forEach(([key, value]) => {
            fields[key] = value;
        });
        console.log("ENHANCEDPATH-Submitting fields from key fields record form: ", fields);
        this.preventOverwriteSelectedValue = true;
        updateRecord({ fields })
            .then(() => {
                this.rerenderKeyFields = true;
                this._sendToast("Success", `Record updated successfully!`, "success");
            })
            .catch((error) => {
                this._logErrorAndToast(
                    "Error updating record!",
                    this._labelErrorsWithNumbers(this._reduceErrors(error)),
                    "error",
                    error
                );
            })
            .finally(() => {
                this.isSaving = false;
                this.disablePath = false;
                this.showDependentFields = false;
                this.rerenderKeyFields = false;
            });
    }

    _openModal(config) {
        console.log("ENHANCEDPATH-Opening modal for flow or dependent fields.");
        modal
            .open(config)
            .then((result) => {
                console.log("ENHANCEDPATH-Modal closed with result: ", result);
                if (result === undefined) {
                    this._sendToast(
                        "Cancelled",
                        `${this.fieldLabel} update to ${this.selectedLabel} was cancelled.`,
                        "warning"
                    );
                } else if (result.enhancedPathStatus === "success") {
                    this._sendToast(
                        "Success",
                        `${this.fieldLabel} successfully updated to ${this.selectedLabel}!`,
                        "success"
                    );
                    this.currentValue = this.selectedValue;
                } else if (result.enhancedPathStatus === "error") {
                    this._logErrorAndToast(
                        `Error updating ${this.fieldLabel} to ${this.selectedLabel}!`,
                        this._labelErrorsWithNumbers(reduceErrors(result.error)),
                        "error",
                        result.error
                    );
                } else if (result.enhancedPathStatus === "override") {
                    this._sendToast(
                        "Submitted",
                        `The information you provided has been submitted and the ${this.fieldLabel} will be updated to ${this.selectedLabel} after approval!`,
                        "info"
                    );
                }
            })
            .finally(() => {
                this.isSaving = false;
                this.showFlow = false;
                this.disablePath = false;
                this.showDependentFields = false;
            });
    }

    _sendToast(title, message, variant, mode) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
                mode: mode
            })
        );
    }

    _logErrorAndToast(title, message, variant, error) {
        console.error("ENHANCEDPATH-Encountered Error and showed toast:", error);
        this._sendToast(title, message, variant, "sticky");
        console.error("Error in Enhanced Path Component: " + JSON.stringify(error));
    }

    _logErrorNoToast(message, error) {
        console.error("ENHANCEDPATH-Encountered Error and did not show toast:", error);
        console.error(message + ": " + JSON.stringify(error));
    }

    _getStepValueByIndex(index) {
        if (!this.picklistValues || index < 0 || index >= this.picklistValues.length) {
            return null;
        }
        return this.picklistValues[index].value;
    }

    _getAllKeysAsArray(obj, keys = []) {
        Object.keys(obj).forEach((key) => {
            keys.push(key);
            const value = obj[key];
            if (value && typeof value === "object" && !Array.isArray(value)) {
                this._getAllKeysAsArray(value, keys);
            }
        });
        return keys;
    }

    _resolveFilteredDependentFields() {
        const result = {};
        Object.entries(this.dependentFields).forEach(([field, nestedDependencies]) => {
            const fieldData = this.objectPicklistData.picklistFieldValues[field];
            if (!fieldData?.values) return;
            const validIndexes = new Set(fieldData.values.flatMap((picklistValue) => picklistValue.validFor || []));
            validIndexes.forEach((index) => {
                const controllerValue = this._getStepValueByIndex(index);
                if (
                    nestedDependencies &&
                    typeof nestedDependencies === "object" &&
                    Object.keys(nestedDependencies).length > 0
                ) {
                    result[controllerValue] = new Set([
                        ...(result[controllerValue] || []),
                        field,
                        ...this._getAllKeysAsArray(nestedDependencies)
                    ]);
                } else {
                    result[controllerValue] = new Set([...(result[controllerValue] || []), field]);
                }
            });
        });
        this.pathSteps?.forEach((step) => {
            if (step.dependentFields?.length) {
                result[step.value] = new Set([...(result[step.value] || []), ...step.dependentFields]);
            }
        });
        console.log(
            "ENHANCEDPATH-Resolved field dependencies by picklist value (including custom defined dependencies):",
            result
        );
        return result;
    }

    _labelErrorsWithNumbers(reducedErrors) {
        if (reducedErrors.length === 0) return "Unknown error";
        if (reducedErrors.length === 1) return reducedErrors[0];
        return reducedErrors.map((err, index) => `Error ${index + 1}: ${err}`).join(" ");
    }

    _reduceErrors(errors) {
        if (!Array.isArray(errors)) {
            errors = [errors];
        }

        return (
            errors
                // Remove null/undefined items
                .filter((error) => !!error)
                // Extract an error message
                .map((error) => {
                    // UI API read errors
                    if (Array.isArray(error.body)) {
                        return error.body.map((e) => e.message);
                    }
                    // Page level errors
                    else if (error?.body?.pageErrors && error.body.pageErrors.length > 0) {
                        return error.body.pageErrors.map((e) => e.message);
                    }
                    // Field level errors
                    else if (error?.body?.fieldErrors && Object.keys(error.body.fieldErrors).length > 0) {
                        const fieldErrors = [];
                        Object.values(error.body.fieldErrors).forEach((errorArray) => {
                            fieldErrors.push(...errorArray.map((e) => e.message));
                        });
                        return fieldErrors;
                    }
                    // UI API DML page level errors
                    else if (error?.body?.output?.errors && error.body.output.errors.length > 0) {
                        return error.body.output.errors.map((e) => e.message);
                    }
                    // UI API DML field level errors
                    else if (
                        error?.body?.output?.fieldErrors &&
                        Object.keys(error.body.output.fieldErrors).length > 0
                    ) {
                        const fieldErrors = [];
                        Object.values(error.body.output.fieldErrors).forEach((errorArray) => {
                            fieldErrors.push(...errorArray.map((e) => e.message));
                        });
                        return fieldErrors;
                    }
                    // UI API DML, Apex and network errors
                    else if (error.body && typeof error.body.message === "string") {
                        return error.body.message;
                    }
                    // JS errors
                    else if (typeof error.message === "string") {
                        return error.message;
                    }
                    // Unknown error shape so try HTTP status text
                    return error.statusText;
                })
                // Flatten
                .reduce((prev, curr) => prev.concat(curr), [])
                // Remove empty strings
                .filter((message) => !!message)
        );
    }
}
