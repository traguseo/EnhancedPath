/**
 * Created by Tyler on 7/15/2025.
 */

@IsTest
private class QueueableSyncPathAssistantsTest {
    private static final List<String> OBJECT_API_NAMES = new List<String>{
        'Lead',
        'Opportunity',
        'Account',
        'Contact',
        'Case',
        'CustomObject__c',
        'CustomObject2__c',
        'CustomObject3__c',
        'CustomObject4__c',
        'CustomObject5__c',
        'CustomObject6__c'
    };
    private static final List<String> PICKLIST_VALUE_NAMES = new List<String>{
        'New',
        'Working',
        'Closed',
        'Qualified',
        'Prospecting',
        'Negotiation',
        'Unqualified',
        'Closed Won',
        'Closed Lost'
    };

    @IsTest
    static void shouldReturnTwoBatchesOfListStringToLoopThrough() {
        Test.setMock(WebServiceMock.class, new EnhancedPathMock());
        Test.startTest();
        List<List<String>> batches = QueueableSyncPathAssistants.getAllPathAssistantNamesInBatchesOfTen();
        Test.stopTest();
        Assert.areEqual(batches.size(), 2, 'Expected two batches to be returned');
    }

    @IsTest
    static void shouldUpsertPathAssistantsAndStepsSuccessfully() {
        Test.setMock(WebServiceMock.class, new EnhancedPathMock());
        Test.startTest();
        new QueueableSyncPathAssistants().execute(null);
        Test.stopTest();
        Assert.areEqual(
            OBJECT_API_NAMES.size() + 1,
            [SELECT Id FROM PathAssistant__c].size(),
            'Expected all path assistants to be upserted'
        );
        Integer expectedSteps = (OBJECT_API_NAMES.size() + 1) * PICKLIST_VALUE_NAMES.size();
        Assert.areEqual(
            expectedSteps,
            [SELECT Id FROM PathAssistantStep__c].size(),
            'Expected all path assistant steps to be upserted'
        );
    }

    private class EnhancedPathMock implements WebServiceMock {
        public void doInvoke(
            Object stub,
            Object request,
            Map<String, Object> response,
            String endpoint,
            String soapAction,
            String requestName,
            String responseNS,
            String responseName,
            String responseType
        ) {
            if (request instanceof PathAssistantMetadataService.listMetadata_element) {
                PathAssistantMetadataService.listMetadataResponse_element listMetadataResponse = new PathAssistantMetadataService.listMetadataResponse_element();
                List<PathAssistantMetadataService.FileProperties> pathAssistantsToReturn = new List<PathAssistantMetadataService.FileProperties>();
                for (String objectApiName : OBJECT_API_NAMES) {
                    PathAssistantMetadataService.FileProperties path = new PathAssistantMetadataService.FileProperties();
                    path.fullName = objectApiName + '_Status___MASTER__';
                    path.type_x = 'PathAssistant';
                    pathAssistantsToReturn.add(path);
                }
                listMetadataResponse.result = pathAssistantsToReturn;
                response.put('response_x', listMetadataResponse);
            } else if (request instanceof PathAssistantMetadataService.readMetadata_element) {
                PathAssistantMetadataService.readMetadata_element req = (PathAssistantMetadataService.readMetadata_element) request;
                PathAssistantMetadataService.readPathAssistantResponse_element readMetadataResponse = new PathAssistantMetadataService.readPathAssistantResponse_element();
                List<PathAssistantMetadataService.PathAssistant> pathAssistantsToReturn = new List<PathAssistantMetadataService.PathAssistant>();
                if (req.fullNames.size() == 1) {
                    PathAssistantMetadataService.PathAssistant path = new PathAssistantMetadataService.PathAssistant();
                    path.fullName = 'CustomObject7__c_Status___MASTER__';
                    path.entityName = 'CustomObject7__c';
                    path.fieldName = 'Status';
                    path.recordTypeName = '__MASTER__';
                    path.active = true;
                    List<PathAssistantMetadataService.PathAssistantStep> steps = new List<PathAssistantMetadataService.PathAssistantStep>();
                    for (String picklistValueName : PICKLIST_VALUE_NAMES) {
                        PathAssistantMetadataService.PathAssistantStep step = new PathAssistantMetadataService.PathAssistantStep();
                        step.picklistValueName = picklistValueName;
                        step.info = 'Info for ' + picklistValueName;
                        step.fieldNames = new List<String>{ 'Company', 'LastName' };
                        steps.add(step);
                    }
                    path.pathAssistantSteps = steps;
                    pathAssistantsToReturn.add(path);
                    PathAssistantMetadataService.ReadPathAssistantResult result = new PathAssistantMetadataService.ReadPathAssistantResult();
                    result.records = pathAssistantsToReturn;
                    readMetadataResponse.result = result;
                    response.put('response_x', readMetadataResponse);
                } else {
                    for (String objectApiName : OBJECT_API_NAMES) {
                        PathAssistantMetadataService.PathAssistant path = new PathAssistantMetadataService.PathAssistant();
                        path.fullName = objectApiName + '_Status___MASTER__';
                        path.entityName = objectApiName;
                        path.fieldName = 'Status';
                        path.recordTypeName = '__MASTER__';
                        path.active = true;
                        List<PathAssistantMetadataService.PathAssistantStep> steps = new List<PathAssistantMetadataService.PathAssistantStep>();
                        for (String picklistValueName : PICKLIST_VALUE_NAMES) {
                            PathAssistantMetadataService.PathAssistantStep step = new PathAssistantMetadataService.PathAssistantStep();
                            step.picklistValueName = picklistValueName;
                            step.info = 'Info for ' + picklistValueName;
                            step.fieldNames = new List<String>{ 'Company', 'LastName' };
                            steps.add(step);
                        }
                        path.pathAssistantSteps = steps;
                        pathAssistantsToReturn.add(path);
                    }
                    PathAssistantMetadataService.ReadPathAssistantResult result = new PathAssistantMetadataService.ReadPathAssistantResult();
                    result.records = pathAssistantsToReturn;
                    readMetadataResponse.result = result;
                    response.put('response_x', readMetadataResponse);
                }
            }
            return;
        }
    }
}