/**
 * Created by Tyler on 7/11/2025.
 */

public with sharing class QueueableSyncPathAssistants implements Queueable, Database.AllowsCallouts {
    private static final Double API_VERSION = 64.0;
    private static final PathAssistantMetadataService.MetadataPort service = createService();

    public void execute(QueueableContext qc) {
        List<PathAssistant__c> pathAssistantsToUpsert = new List<PathAssistant__c>();
        List<PathAssistantStep__c> pathAssistantStepsToUpsert = new List<PathAssistantStep__c>();
        for (List<String> patchAssistantNames : getAllPathAssistantNamesInBatchesOfTen()) {
            List<PathAssistantMetadataService.PathAssistant> pathAssistants = (List<PathAssistantMetadataService.PathAssistant>) service.readMetadata(
                    'PathAssistant',
                    patchAssistantNames
                )
                .getRecords();
            for (PathAssistantMetadataService.PathAssistant pathAssistant : pathAssistants) {
                String parentExternalId =
                    pathAssistant.entityName +
                    '_' +
                    pathAssistant.fieldName +
                    '_' +
                    pathAssistant.recordTypeName;
                pathAssistantsToUpsert.add(
                    new PathAssistant__c(
                        Name = pathAssistant.fullName.left(80),
                        IsActive__c = pathAssistant.active,
                        ObjectApiName__c = pathAssistant.entityName,
                        FieldApiName__c = pathAssistant.fieldName,
                        RecordTypeName__c = pathAssistant.recordTypeName,
                        ExternalId__c = parentExternalId
                    )
                );
                if (pathAssistant.pathAssistantSteps != null && pathAssistant.pathAssistantSteps.size() > 0) {
                    for (
                        PathAssistantMetadataService.PathAssistantStep pathAssistantStep : pathAssistant.pathAssistantSteps
                    ) {
                        String childExternalId = parentExternalId + '_' + pathAssistantStep.picklistValueName;
                        PathAssistantStep__c step = new PathAssistantStep__c(
                            Name = pathAssistantStep.picklistValueName.left(80),
                            PicklistValue__c = pathAssistantStep.picklistValueName,
                            ExternalId__c = childExternalId,
                            PathAssistant__r = new PathAssistant__c(ExternalId__c = parentExternalId)
                        );
                        // This allows users to define the key fields + guidance on the PathAssistantStep__c records
                        // if they want to and not have them overwritten when the sync job runs as long as they are not
                        // defined on the Path Assistant metadata
                        if (pathAssistantStep.fieldNames != null && pathAssistantStep.fieldNames.size() > 0) {
                            step.KeyFieldNames__c = String.join(pathAssistantStep.fieldNames, ',');
                        }
                        if (pathAssistantStep.info != null && pathAssistantStep.info.length() > 0) {
                            step.Info__c = pathAssistantStep.info;
                        }
                        pathAssistantStepsToUpsert.add(step);
                    }
                }
            }
        }
        List<Database.UpsertResult> results = Database.upsert(
            pathAssistantsToUpsert,
            PathAssistant__c.ExternalId__c,
            false
        );
        List<Database.UpsertResult> stepResults = Database.upsert(
            pathAssistantStepsToUpsert,
            PathAssistantStep__c.ExternalId__c,
            false
        );
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
}
