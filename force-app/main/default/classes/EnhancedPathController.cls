/**
 * Created by Tyler on 7/8/2025.
 */

public with sharing class EnhancedPathController {
    @TestVisible
    private static Map<String, Id> VALID_FLOW_IDS_BY_API_NAME = new Map<String, Id>();

    @AuraEnabled(Cacheable=true)
    public static List<PathStep> getPathAssistantSteps(
        String recordTypeName,
        String objectApiName,
        String fieldApiName
    ) {
        for (FlowDefinitionView flow : [
            SELECT Id, ApiName
            FROM FlowDefinitionView
            WHERE IsActive = TRUE AND ProcessType IN ('Flow', 'Appointments')
        ]) {
            VALID_FLOW_IDS_BY_API_NAME.put(flow.ApiName, flow.Id);
        }
        List<PathAssistant__c> pathAssistants = [
            SELECT
                Id,
                Name,
                IsActive__c,
                ObjectApiName__c,
                FieldApiName__c,
                RecordTypeName__c,
                ExternalId__c,
                (
                    SELECT
                        Id,
                        PicklistValue__c,
                        KeyFieldNames__c,
                        Info__c,
                        ExternalId__c,
                        RunFlow__c,
                        FlowApiName__c,
                        DependentFieldNames__c
                    FROM PathAssistantSteps__r
                )
            FROM PathAssistant__c
            WHERE
                ObjectApiName__c = :objectApiName
                AND FieldApiName__c = :fieldApiName
                AND RecordTypeName__c = :recordTypeName
                AND ExternalId__c = :objectApiName + '_' + fieldApiName + '_' + recordTypeName
                AND IsActive__c = TRUE
        ];
        if (pathAssistants.isEmpty()) {
            return new List<PathStep>();
        }
        List<PathStep> steps = new List<PathStep>();
        for (PathAssistant__c pathAssistant : pathAssistants) {
            if (pathAssistant.PathAssistantSteps__r != null && !pathAssistant.PathAssistantSteps__r.isEmpty()) {
                for (PathAssistantStep__c step : pathAssistant.PathAssistantSteps__r) {
                    List<String> keyFields = new List<String>();
                    List<String> dependentFields = new List<String>();
                    if (String.isNotBlank(step.KeyFieldNames__c)) {
                        keyFields = step.KeyFieldNames__c.split(',');
                    }
                    if (String.isNotBlank(step.DependentFieldNames__c)) {
                        dependentFields = step.DependentFieldNames__c.split(',');
                    }
                    if (step.RunFlow__c == true && String.isNotBlank(step.FlowApiName__c)) {
                        step.FlowApiName__c = VALID_FLOW_IDS_BY_API_NAME.containsKey(step.FlowApiName__c)
                            ? step.FlowApiName__c
                            : null;
                    }
                    steps.add(
                        new PathStep(
                            step.PicklistValue__c,
                            step.Info__c,
                            keyFields,
                            step.RunFlow__c,
                            step.FlowApiName__c,
                            step.FlowApiName__c != null ? true : false,
                            dependentFields
                        )
                    );
                }
            }
        }
        return steps;
    }

    public class PathStep {
        @AuraEnabled
        public String value;
        @AuraEnabled
        public String guidance;
        @AuraEnabled
        public List<String> keyFields;
        @AuraEnabled
        public Boolean runFlow;
        @AuraEnabled
        public String flowApiName;
        @AuraEnabled
        public Boolean flowValid;
        @AuraEnabled
        public List<String> dependentFields;
        public PathStep(
            String value,
            String guidance,
            List<String> keyFields,
            Boolean runFlow,
            String flowApiName,
            Boolean flowValid,
            List<String> dependentFields
        ) {
            this.value = value;
            this.guidance = guidance != null ? guidance : '';
            this.keyFields = keyFields;
            this.runFlow = runFlow;
            this.flowApiName = flowApiName;
            this.flowValid = flowValid;
            this.dependentFields = dependentFields;
        }
    }
}