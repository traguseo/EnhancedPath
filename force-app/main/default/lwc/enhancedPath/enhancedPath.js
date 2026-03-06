/**
 *
 * Created by Tyler on 7/8/2025.
 */

import { LightningElement, api, wire } from "lwc";
import { getObjectInfo, getPicklistValues, getPicklistValuesByRecordType } from "lightning/uiObjectInfoApi";
import { getRecord, updateRecord } from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getPathAssistantSteps from "@salesforce/apex/EnhancedPathController.getPathAssistantSteps";
import detectNebulaLoggerType from "@salesforce/apex/EnhancedPathController.detectNebulaLoggerType";
import createAndSaveLogEntry from "@salesforce/apex/EnhancedPathController.createAndSaveLogEntry";
import modal from "c/enhancedPathModal";
import { loadScript } from "lightning/platformResourceLoader";
import JSConfetti from "@salesforce/resourceUrl/jsConfetti";

export default class EnhancedPath extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api fieldApiName;
    @api allowHideKeyFieldsAndGuidance;
    @api groupingLabel;
    hasGroupedValues = false;
    bypassGroupedSelection = false;
    groupingBackendValue = "enhancedpathgrouping";
    hideGuidancePanel = false;
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
    nebulaLoggerType = "Not Present";
    isConfettiLoaded = false;
    confettiInstance = null;
    confettiColors = [
        // Core Salesforce Blues
        "#0176D3", // Salesforce brand blue
        "#1B96FF", // Bright action blue
        "#78C3FB", // Light sky blue
        "#0B5CAB", // Deep blue

        // Purple / Indigo Accents
        "#9050E9",
        "#7F4CE0",
        "#B78DEF",

        // Teal / Aqua
        "#06A59A",
        "#2EC4B6",
        "#91E0D6",

        // Pink / Magenta Accent
        "#E15DAD",
        "#F675C6",

        // Warm Contrast
        "#FFB75D",
        "#F9A825",

        // White for sparkle effect
        "#FFFFFF"
    ];

    connectedCallback() {
        detectNebulaLoggerType()
            .then((result) => {
                this.nebulaLoggerType = result;
                console.log("ENHANCEDPATH-Detected Nebula Logger type: ", this.nebulaLoggerType);
            })
            .catch((err) => {
                this._logErrorNoToast("ENHANCEDPATH-Error detecting Nebula Logger type: ", err);
            });
        if (!this.isConfettiLoaded) {
            loadScript(this, JSConfetti)
                .then(() => {
                    this.isConfettiLoaded = true;
                    this.confettiInstance = new window.JSConfetti();
                    console.log("ENHANCEDPATH-JSConfetti loaded successfully!");
                })
                .catch((err) => {
                    this._logErrorNoToast(`ENHANCEDPATH-Error loading JSConfetti`, err);
                });
        }
    }

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
            this.recordTypeName = data.recordTypeInfo
                ? data.fields["RecordType"]?.value?.fields["DeveloperName"]?.value
                : "__MASTER__";
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
            this.hasGroupedValues = this.pathSteps.some((step) => step.isGrouped);
        } else if (error) {
            this._logErrorNoToast("Error handling wired PathAssistant metadata steps", error);
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
        return Object.values(this.objectInfo.recordTypeInfos || {}).filter((recordType) => !recordType.master).length >
            0
            ? [this.computedFieldApiName, `${this.objectApiName}.RecordType.DeveloperName`]
            : [this.computedFieldApiName];
    }

    get fieldLabel() {
        if (this.objectInfo && this.objectInfo.fields && this.objectInfo.fields[this.fieldApiName]) {
            return this.objectInfo.fields[this.fieldApiName].label;
        }
        return "";
    }

    get displayedStepsWithClass() {
        if (!this.picklistValues) return [];
        return this._buildValuesToShowOnPath();
    }

    get computedFieldApiName() {
        return `${this.objectApiName}.${this.fieldApiName}`;
    }

    get selectedValuePathStep() {
        return (this.pathSteps || []).find((step) => step.value === this.selectedValue);
    }

    get currentValuePathStep() {
        return (this.pathSteps || []).find((step) => step.value === this.currentValue);
    }

    get buttonLabel() {
        return this.selectedValue === this.groupingBackendValue
            ? `Select ${this.groupingLabel} ${this.fieldLabel}`
            : this.currentValue && this.selectedValuePathStep?.isGrouped
              ? `Change ${this.groupingLabel} ${this.fieldLabel}`
              : this.selectedValue === this.currentValue
                ? `Mark ${this.fieldLabel} as Complete`
                : `Mark as Current ${this.fieldLabel}`;
    }

    get disableCompleteButton() {
        const idx = this.picklistValues.findIndex(
            (step) => step.value === this.currentValue && step.value === this.selectedValue
        );
        return idx === this.picklistValues.length - 1 && !this.selectedValuePathStep?.isGrouped;
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
            (this.selectedValuePathStep.guidance || this.selectedValuePathStep.keyFields.length > 0) &&
            !this.hideGuidancePanel
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

    get chevronIcon() {
        return this.hideGuidancePanel ? "utility:chevronright" : "utility:chevrondown";
    }

    get collapseButtonLabel() {
        return this.hideGuidancePanel ? "Show More" : "Show Less";
    }

    get groupedValues() {
        if (!this.pathSteps || !this.picklistValues) return [];

        return this.pathSteps
            .filter((step) => step.isGrouped)
            .map((step) => ({
                value: step.value,
                label: this.picklistValues.find((pv) => pv.value === step.value)?.label || step.value
            }));
    }

    handleToggleGuidancePanel() {
        this.hideGuidancePanel = !this.hideGuidancePanel;
    }

    isCompleted(value) {
        if (!this.picklistValues || !this.currentValue) return false;
        const currentIdx = this.picklistValues.findIndex((step) => step.value === this.currentValue);
        const stepIdx = this.picklistValues.findIndex((step) => step.value === value);
        return stepIdx < currentIdx && value !== this.groupingBackendValue;
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
        console.log(
            `ENHANCEDPATH-User initiated update to value: ${this.selectedValue} with label: ${this.selectedLabel} from current value: ${this.currentValue}. Checking for flows or dependent fields to determine next steps...`
        );
        console.log("ENHANCEDPATH-Selected value path step metadata: ", this.selectedValuePathStep);
        console.log("ENHANCEDPATH-Selected value dependent fields: ", this.selectedValueDependentFields);
        if (this.currentValue === this.selectedValue && !this.selectedValuePathStep?.isGrouped) {
            const currentIndex = this.picklistValues.findIndex((step) => step.value === this.currentValue);
            if (currentIndex < this.picklistValues.length - 1) {
                this.selectedValue = this.picklistValues[currentIndex + 1].value;
                this.selectedLabel = this.picklistValues[currentIndex + 1].label;
            }
        }
        if (
            (this.selectedValue === this.groupingBackendValue || this.selectedValuePathStep?.isGrouped) &&
            !this.bypassGroupedSelection
        ) {
            this._sendToast(
                "Action Required",
                `Moving the ${this.fieldLabel} to ${this.selectedLabel} requires additional steps!`,
                "info"
            );
            this.isSaving = false;
            this.disablePath = true;
            this._openModal({
                label: "Enhanced Path Modal",
                size: "large",
                description: `Action Required: Must select a ${this.groupingLabel} value for ${this.fieldLabel}!`,
                recordId: this.recordId,
                recordTypeId: this.recordTypeId,
                objectApiName: this.objectApiName,
                fieldApiName: this.fieldApiName,
                fieldLabel: this.fieldLabel,
                selectedLabel: this.selectedLabel,
                selectedValue: this.selectedValue,
                showDependentFields: false,
                showFlow: false,
                groupLabel: this.groupingLabel,
                groupedValues: this.groupedValues
            });
        } else if (this.selectedValuePathStep?.runFlow) {
            if (this.selectedValuePathStep?.flowValid) {
                this._sendToast(
                    "Action Required",
                    `Moving the ${this.fieldLabel} to ${this.selectedLabel} requires additional steps!`,
                    "info"
                );
                this.isSaving = false;
                this.disablePath = true;
                this._openModal({
                    label: "Enhanced Path Modal",
                    size: "large",
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
                    showDependentFields: false,
                    showFlow: true,
                    groupLabel: this.groupingLabel
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
        } else if (this.selectedValueDependentFields?.length > 0) {
            this._sendToast(
                "Action Required",
                `Moving the ${this.fieldLabel} to ${this.selectedLabel} requires additional steps!`,
                "info"
            );
            console.log(
                "ENHANCEDPATH-Dependent fields detected, showing record edit form with fields: ",
                this.selectedValueDependentFields
            );
            this.isSaving = false;
            this.disablePath = true;
            this._openModal({
                label: "Enhanced Path Modal",
                size: "large",
                description: `Action Required: Moving the ${this.fieldLabel} to ${this.selectedLabel} requires additional steps!`,
                recordId: this.recordId,
                recordTypeId: this.recordTypeId,
                objectApiName: this.objectApiName,
                fieldApiName: this.fieldApiName,
                fieldLabel: this.fieldLabel,
                dependentFields: this.selectedValueDependentFields,
                selectedLabel: this.selectedLabel,
                selectedValue: this.selectedValue,
                showDependentFields: true,
                showFlow: false,
                groupLabel: this.groupingLabel
            });
        } else {
            console.log("ENHANCEDPATH-No flow or dependent fields required, saving directly.");
            this.handleSaveFromButton();
        }
        this.bypassGroupedSelection = false;
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
                this._showConfettiIfRelevant();
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
                    this._showConfettiIfRelevant();
                } else if (result.enhancedPathStatus === "error") {
                    this._logErrorAndToast(
                        `Error updating ${this.fieldLabel} to ${this.selectedLabel}!`,
                        this._labelErrorsWithNumbers(reduceErrors(result.error)),
                        "error",
                        result.error
                    );
                } else if (result.enhancedPathStatus === "override") {
                    this._sendToast(result.toastTitle, result.toastMessage, result.toastVariant);
                } else if (result.enhancedPathStatus === "groupingSelected") {
                    this.selectedValue = result.groupingValue;
                    this.selectedLabel = result.groupingLabel;
                    this.bypassGroupedSelection = true;
                    this.handleMarkComplete();
                }
            })
            .finally(() => {
                this.isSaving = false;
                this.disablePath = false;
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

    _showConfettiIfRelevant() {
        if (this.isConfettiLoaded && this.confettiInstance && this.selectedValuePathStep?.showConfetti) {
            this.confettiInstance.addConfetti({
                confettiColors: this.confettiColors,
                confettiNumber: 120,
                confettiRadius: 10
            });
        }
    }

    _logErrorAndToast(title, message, variant, error) {
        console.error("ENHANCEDPATH-Encountered Error and showed toast:", error);
        this._sendToast(title, message, variant, "sticky");
        this._logErrorToNebulaLogger(error);
    }

    _logErrorNoToast(message, error) {
        console.error("ENHANCEDPATH-Encountered Error and did not show toast:", error);
        this._logErrorToNebulaLogger(error);
    }

    _logErrorToNebulaLogger(error) {
        if (this.nebulaLoggerType !== "Not Present") {
            createAndSaveLogEntry({
                nebulaLoggerType: this.nebulaLoggerType,
                input: {
                    loggingLevel: "ERROR",
                    message: `Enhanced Path LWC encountered error with current value: ${this.currentValue} and selected value: ${this.selectedValue} for field: ${this.fieldApiName}. \n\nError(s): ${this._labelErrorsWithNumbers(this._reduceErrors(error))}`,
                    recordId: this.recordId
                }
            })
                .then((result) => {
                    if (result) {
                        console.log("ENHANCEDPATH-Logged error to Nebula Logger successfully!");
                    } else {
                        console.error("ENHANCEDPATH-Nebula Logger save unsuccessful");
                    }
                })
                .catch((loggingError) => {
                    console.error("ENHANCEDPATH-Error logging to Nebula Logger:", loggingError);
                });
        }
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

    _buildValuesToShowOnPath() {
        //store as a constant and pass it to the _buildObjectForPathValue function to avoid having that function do a find on the pathSteps array for every single step
        const currentValuePathStep = this.currentValuePathStep;
        let valuesToShowOnPath = this.picklistValues
            .filter((step) => {
                const pathStep = this.pathSteps.find((ps) => ps.value === step.value);
                return !pathStep?.isGrouped;
            })
            .map((step) => this._buildObjectForPathValue(step, currentValuePathStep));

        if (this.hasGroupedValues) {
            const groupingStep = this.pathSteps.find((step) => step.value === this.currentValue && step.isGrouped);
            const groupingValue = groupingStep?.isGrouped ? groupingStep.value : this.groupingBackendValue;
            const groupingLabel =
                this.picklistValues.find((pv) => pv.value === groupingValue)?.label || this.groupingLabel;

            valuesToShowOnPath = [
                ...valuesToShowOnPath,
                this._buildObjectForPathValue({ value: groupingValue, label: groupingLabel }, currentValuePathStep)
            ];
        }
        return valuesToShowOnPath;
    }

    _buildObjectForPathValue(step, currentValuePathStep) {
        let classes = "slds-path__item";
        let isComplete = false;
        let isIncomplete = true;
        let isCurrent = false;
        let isLost = false;
        let isWon = false;
        if (step.value === this.currentValue) {
            classes += " slds-is-current";
            if (currentValuePathStep?.isGrouped && currentValuePathStep?.isLost) {
                classes += " slds-is-lost slds-is-active";
                isLost = true;
            } else if (currentValuePathStep?.isGrouped && !currentValuePathStep?.isLost) {
                classes += " slds-is-won slds-is-active";
                isWon = true;
            } else if (step.value === this.selectedValue) {
                classes += " slds-is-active";
            }
            isCurrent = true;
        } else if (step.value === this.selectedValue) {
            classes += " slds-is-active";
        } else if (this.isCompleted(step.value)) {
            if (currentValuePathStep?.isGrouped && currentValuePathStep?.isLost) {
                classes += " slds-is-incomplete";
                isIncomplete = true;
            } else if (currentValuePathStep?.isGrouped && currentValuePathStep?.isLost) {
                classes += " slds-is-complete";
                isComplete = true;
            } else {
                classes += " slds-is-complete";
                isComplete = true;
                isIncomplete = false;
            }
        } else {
            classes += " slds-is-incomplete";
            isIncomplete = true;
        }
        return { ...step, stepClass: classes, isComplete, isCurrent, isIncomplete, isLost, isWon };
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
