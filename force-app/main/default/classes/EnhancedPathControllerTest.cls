/**
 * Created by Tyler on 7/8/2025.
 */

@IsTest
private class EnhancedPathControllerTest {
    @IsTest
    static void shouldReturnStepsFromBuildMethod() {
        Test.startTest();
        EnhancedPathController.VALID_FLOW_IDS_BY_API_NAME.put('Test', '301xx000000XyzA');
        List<EnhancedPathController.PathStep> steps = EnhancedPathController.buildPathSteps(
            new List<EnhancedPathConfiguration__mdt>{
                new EnhancedPathConfiguration__mdt(
                    PicklistApiValue__c = 'New',
                    KeyFieldApiNames__c = 'Company, LastName',
                    DependentFieldApiNames__c = 'Email, MobilePhone',
                    OptionalFieldApiNames__c = 'FirstName, Title',
                    FlowApiName__c = 'Test'
                )
            }
        );
        Test.stopTest();
        Assert.areEqual('New', steps[0].value, 'Expected picklist value to be New');
        Assert.areEqual(
            new List<String>{ 'Company', 'LastName' },
            steps[0].keyFields,
            'Expected key field names to match'
        );
        Assert.areEqual(
            new List<String>{ 'Email', 'MobilePhone' },
            steps[0].dependentFields,
            'Expected dependent field names to match'
        );
        Assert.areEqual(
            new List<String>{ 'FirstName', 'Title' },
            steps[0].optionalFields,
            'Expected optional field names to match'
        );
        Assert.areEqual('Test', steps[0].flowApiName, 'Expected flowApiName to be Test');
        Assert.areEqual(true, steps[0].flowValid, 'Expected flowValid to be true');
    }

    @IsTest
    static void shouldReturnStepsWithInvalidFlow() {
        Test.startTest();
        List<EnhancedPathController.PathStep> steps = EnhancedPathController.buildPathSteps(
            new List<EnhancedPathConfiguration__mdt>{
                new EnhancedPathConfiguration__mdt(PicklistApiValue__c = 'New', FlowApiName__c = 'Test')
            }
        );
        Test.stopTest();
        Assert.areEqual(1, steps.size(), 'Expected one path step to be returned');
        Assert.areEqual(false, steps[0].flowValid, 'Expected flowValid to be false');
    }

    @IsTest
    static void shouldReturnEmptyList() {
        Test.startTest();
        List<EnhancedPathController.PathStep> steps = EnhancedPathController.getPathAssistantSteps('A', 'B', 'C');
        Test.stopTest();
        Assert.areEqual(0, steps.size(), 'Expected an empty list to be returned');
    }

    @IsTest
    static void shouldAttemptToCreateAndSaveLogEntry() {
        Test.startTest();
        String nebulaLoggerType = EnhancedPathController.detectNebulaLoggerType();
        Map<String, Object> input = new Map<String, Object>{ 'loggingLevel' => 'ERROR', 'message' => 'Test' };
        Boolean result = EnhancedPathController.createAndSaveLogEntry(nebulaLoggerType, input);
        Test.stopTest();
        Assert.isTrue(result, 'Expected createAndSaveLogEntry to return true');
    }

    @IsTest
    static void handlesSomeBadValueForDetection() {
        Test.startTest();
        Map<String, Object> input = new Map<String, Object>{ 'loggingLevel' => 'ERROR', 'message' => 'Test' };
        Boolean result = EnhancedPathController.createAndSaveLogEntry('SomeBadValue', input);
        Test.stopTest();
        Assert.isFalse(result, 'Expected createAndSaveLogEntry to return false with bad/unexpected logger type');
    }
}
