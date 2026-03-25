/**
 * Created by Tyler on 7/11/2025.
 */

public with sharing class QueueableSyncPathAssistants implements Queueable, Database.AllowsCallouts {
    private static final Double API_VERSION = 66.0;
    private static final PathAssistantMetadataService.MetadataPort service = createService();
    private static final String CUSTOM_METADATA_TYPE = 'EnhancedPathConfiguration__mdt';

    public void execute(QueueableContext qc) {
        Metadata.DeployContainer container = new Metadata.DeployContainer();
        for (List<String> patchAssistantNames : getAllPathAssistantNamesInBatchesOfTen()) {
            List<PathAssistantMetadataService.PathAssistant> pathAssistants = (List<PathAssistantMetadataService.PathAssistant>) service.readMetadata(
                    'PathAssistant',
                    patchAssistantNames
                )
                .getRecords();
            for (PathAssistantMetadataService.PathAssistant pathAssistant : pathAssistants) {
                if (pathAssistant.pathAssistantSteps != null && pathAssistant.pathAssistantSteps.size() > 0) {
                    for (
                        PathAssistantMetadataService.PathAssistantStep pathAssistantStep : pathAssistant.pathAssistantSteps
                    ) {
                        String uniqueId =
                            normalizeApiName(pathAssistant.entityName) +
                            normalizeApiName(pathAssistant.fieldName) +
                            normalizeApiName(pathAssistant.recordTypeName) +
                            pathAssistantStep.picklistValueName.replaceAll('[^a-zA-Z0-9]', '').left(10);
                        Metadata.CustomMetadata cmd = new Metadata.CustomMetadata();
                        cmd.fullName = CUSTOM_METADATA_TYPE + '.' + uniqueId;
                        cmd.label = uniqueId;
                        Metadata.CustomMetadataValue objectApiNameValue = new Metadata.CustomMetadataValue();
                        objectApiNameValue.field = 'ObjectApiName__c';
                        objectApiNameValue.value = pathAssistant.entityName;
                        cmd.values.add(objectApiNameValue);
                        Metadata.CustomMetadataValue fieldApiNameValue = new Metadata.CustomMetadataValue();
                        fieldApiNameValue.field = 'FieldApiName__c';
                        fieldApiNameValue.value = pathAssistant.fieldName;
                        cmd.values.add(fieldApiNameValue);
                        Metadata.CustomMetadataValue recordTypeApiNameValue = new Metadata.CustomMetadataValue();
                        recordTypeApiNameValue.field = 'RecordTypeApiName__c';
                        recordTypeApiNameValue.value = pathAssistant.recordTypeName;
                        cmd.values.add(recordTypeApiNameValue);
                        Metadata.CustomMetadataValue picklistValue = new Metadata.CustomMetadataValue();
                        picklistValue.field = 'PicklistApiValue__c';
                        picklistValue.value = pathAssistantStep.picklistValueName;
                        cmd.values.add(picklistValue);
                        Metadata.CustomMetadataValue isActiveValue = new Metadata.CustomMetadataValue();
                        isActiveValue.field = 'IsActive__c';
                        isActiveValue.value = true;
                        cmd.values.add(isActiveValue);
                        // This allows users to define the key fields + guidance on the EnhancedPathConfigStep__mdt records
                        // if they want to and not have them overwritten when the sync job runs as long as they are not
                        // defined on the Path Assistant metadata (native SF path settings)
                        if (pathAssistantStep.fieldNames != null && pathAssistantStep.fieldNames.size() > 0) {
                            Metadata.CustomMetadataValue keyFieldNamesValue = new Metadata.CustomMetadataValue();
                            keyFieldNamesValue.field = 'KeyFieldApiNames__c';
                            keyFieldNamesValue.value = String.join(pathAssistantStep.fieldNames, ',');
                            cmd.values.add(keyFieldNamesValue);
                        }
                        if (pathAssistantStep.info != null && pathAssistantStep.info.length() > 0) {
                            Metadata.CustomMetadataValue guidanceForSuccessValue = new Metadata.CustomMetadataValue();
                            guidanceForSuccessValue.field = 'GuidanceForSuccess__c';
                            guidanceForSuccessValue.value = pathAssistantStep.info;
                            cmd.values.add(guidanceForSuccessValue);
                        }
                        container.addMetadata(cmd);
                    }
                }
            }
        }
        if (container.getMetadata().size() > 0 && !Test.isRunningTest()) {
            Id jobId = Metadata.Operations.enqueueDeployment(container, new SyncPathAssistantsCallback());
        }
    }

    private static PathAssistantMetadataService.MetadataPort createService() {
        PathAssistantMetadataService.MetadataPort service = new PathAssistantMetadataService.MetadataPort();
        service.SessionHeader = new PathAssistantMetadataService.SessionHeader_element();
        service.SessionHeader.sessionId = UserInfo.getSessionId();
        return service;
    }

    @TestVisible
    private static List<List<String>> getAllPathAssistantNamesInBatchesOfTen() {
        List<List<String>> pathAssistantNamesBatches = new List<List<String>>();
        PathAssistantMetadataService.ListMetadataQuery query = new PathAssistantMetadataService.ListMetadataQuery();
        query.type_x = 'PathAssistant';
        List<PathAssistantMetadataService.FileProperties> allPathAssistants = service.listMetadata(
            new List<PathAssistantMetadataService.ListMetadataQuery>{ query },
            API_VERSION
        );
        List<String> pathAssistantNames = new List<String>();
        for (PathAssistantMetadataService.FileProperties pathAssistant : allPathAssistants) {
            pathAssistantNames.add(pathAssistant.fullName);
        }
        if (pathAssistantNames.size() > 10) {
            for (Integer i = 0; i < pathAssistantNames.size(); i += 10) {
                List<String> batch = new List<String>();
                for (Integer j = i; j < Math.min(i + 10, pathAssistantNames.size()); j++) {
                    batch.add(pathAssistantNames[j]);
                }
                pathAssistantNamesBatches.add(batch);
            }
        } else {
            pathAssistantNamesBatches.add(pathAssistantNames);
        }
        return pathAssistantNamesBatches;
    }

    private static String normalizeApiName(String apiName) {
        String returnValue = apiName.trim().replace('__c', '');
        Integer namespaceSeparatorStartingIndex = returnValue.indexOf('__');
        if (namespaceSeparatorStartingIndex > 0) {
            returnValue = returnValue.substringAfter('__');
        }
        returnValue = returnValue.replaceAll('__', '');
        return returnValue.left(10);
    }

    public class SyncPathAssistantsCallback implements Metadata.DeployCallback {
        public void handleResult(Metadata.DeployResult result, Metadata.DeployCallbackContext context) {
            if (result?.status != Metadata.DeployStatus.Succeeded) {
                EnhancedPathController.createAndSaveLogEntry(
                    EnhancedPathController.detectNebulaLoggerType(),
                    new Map<String, Object>{
                        'loggingLevel' => 'ERROR',
                        'message' => 'QueueableSyncPathAssistants failed to deploy Custom Metadata records with error:\n\n' +
                        combineAllComponentFailureMessages(result)
                    }
                );
            }
        }

        private String combineAllComponentFailureMessages(Metadata.DeployResult result) {
            String combinedMessage = '';
            if (result?.details?.componentFailures != null) {
                for (Metadata.DeployMessage failure : result.details.componentFailures) {
                    combinedMessage +=
                        'Problem with component: ' +
                        failure.componentType +
                        ' named ' +
                        failure.fullName +
                        '. Error message: ' +
                        failure.problem +
                        '\n';
                }
            }
            return combinedMessage;
        }
    }
}
