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
        List<FlowDefinitionView> activeFlows = [
            SELECT Id, ApiName
            FROM FlowDefinitionView
            WHERE IsActive = TRUE AND ProcessType IN ('Flow', 'Appointments')
        ];
        for (FlowDefinitionView flow : activeFlows) {
            VALID_FLOW_IDS_BY_API_NAME.put(flow.ApiName, flow.Id);
        }
        List<EnhancedPathConfiguration__mdt> configs = [
            SELECT
                Id,
                PicklistApiValue__c,
                KeyFieldApiNames__c,
                GuidanceForSuccess__c,
                FlowApiName__c,
                DependentFieldApiNames__c,
                OptionalFieldApiNames__c,
                IsGrouped__c,
                IsLost__c,
                ShowConfetti__c
            FROM EnhancedPathConfiguration__mdt
            WHERE
                ObjectApiName__c = :objectApiName
                AND FieldApiName__c = :fieldApiName
                AND RecordTypeApiName__c = :recordTypeName
                AND IsActive__c = TRUE
        ];
        List<PathStep> steps = buildPathSteps(configs);
        return steps;
    }

    @TestVisible
    private static List<PathStep> buildPathSteps(List<EnhancedPathConfiguration__mdt> configs) {
        List<PathStep> steps = new List<PathStep>();
        for (EnhancedPathConfiguration__mdt step : configs) {
            List<String> keyFields = new List<String>();
            List<String> dependentFields = new List<String>();
            List<String> optionalFields = new List<String>();
            if (String.isNotBlank(step.KeyFieldApiNames__c)) {
                keyFields = step.KeyFieldApiNames__c.replaceAll(' ', '').trim().split(',');
            }
            if (String.isNotBlank(step.DependentFieldApiNames__c)) {
                dependentFields = step.DependentFieldApiNames__c.replaceAll(' ', '').trim().split(',');
            }
            if (String.isNotBlank(step.OptionalFieldApiNames__c)) {
                optionalFields.addAll(step.OptionalFieldApiNames__c.replaceAll(' ', '').trim().split(','));
            }
            if (String.isNotBlank(step.FlowApiName__c)) {
                step.FlowApiName__c = VALID_FLOW_IDS_BY_API_NAME.containsKey(
                        step.FlowApiName__c.replaceAll(' ', '').trim()
                    )
                    ? step.FlowApiName__c.replaceAll(' ', '').trim()
                    : null;
            }
            steps.add(
                new PathStep(
                    step.PicklistApiValue__c,
                    step.GuidanceForSuccess__c,
                    keyFields,
                    step.FlowApiName__c,
                    step.FlowApiName__c != null ? true : false,
                    dependentFields,
                    optionalFields,
                    step.IsGrouped__c,
                    step.IsLost__c,
                    step.ShowConfetti__c
                )
            );
        }
        return steps;
    }

    @AuraEnabled
    public static String detectNebulaLoggerType() {
        System.Callable unlockedNebulaLogger = (System.Callable) Type.forName('CallableLogger')?.newInstance();
        System.Callable lockedNebulaLogger = (System.Callable) Type.forName('Nebula.CallableLogger')?.newInstance();
        String nebulaLoggerType = unlockedNebulaLogger != null
            ? 'CallableLogger'
            : lockedNebulaLogger != null ? 'Nebula.CallableLogger' : 'Not Present';
        return nebulaLoggerType;
    }

    @AuraEnabled
    public static Boolean createAndSaveLogEntry(String nebulaLoggerType, Map<String, Object> input) {
        System.Callable dynamicLogger = (System.Callable) Type.forName(
                nebulaLoggerType == 'Not Present' ? 'MockEnhancedPathCallable' : nebulaLoggerType
            )
            ?.newInstance();
        if (dynamicLogger == null) {
            return false;
        }
        Map<String, Object> newEntryOutput = (Map<String, Object>) dynamicLogger.call('newEntry', input);
        Boolean newEntrySuccess = (Boolean) newEntryOutput.get('isSuccess');
        if (!newEntrySuccess) {
            throw new AuraHandledException(
                'Failed to create Nebula Logger log entry: ' + newEntryOutput.get('exceptionMessage')
            );
        }
        Map<String, Object> saveLogOutput = (Map<String, Object>) dynamicLogger.call('saveLog', null);
        Boolean saveLogSuccess = (Boolean) saveLogOutput.get('isSuccess');
        if (!saveLogSuccess) {
            throw new AuraHandledException(
                'Failed to create Nebula Logger log entry: ' + saveLogOutput.get('exceptionMessage')
            );
        }
        return true;
    }
    public class PathStep {
        @AuraEnabled
        public String value;
        @AuraEnabled
        public String guidance;
        @AuraEnabled
        public List<String> keyFields;
        @AuraEnabled
        public String flowApiName;
        @AuraEnabled
        public Boolean flowValid;
        @AuraEnabled
        public List<String> dependentFields;
        @AuraEnabled
        public List<String> optionalFields;
        @AuraEnabled
        public Boolean isGrouped;
        @AuraEnabled
        public Boolean isLost;
        @AuraEnabled
        public Boolean showConfetti;
        public PathStep(
            String value,
            String guidance,
            List<String> keyFields,
            String flowApiName,
            Boolean flowValid,
            List<String> dependentFields,
            List<String> optionalFields,
            Boolean isGrouped,
            Boolean isLost,
            Boolean showConfetti
        ) {
            this.value = value;
            this.guidance = guidance != null ? guidance : '';
            this.keyFields = keyFields;
            this.flowApiName = flowApiName;
            this.flowValid = flowValid;
            this.dependentFields = dependentFields;
            this.optionalFields = optionalFields;
            this.isGrouped = isGrouped;
            this.isLost = isLost;
            this.showConfetti = showConfetti;
        }
    }
}
