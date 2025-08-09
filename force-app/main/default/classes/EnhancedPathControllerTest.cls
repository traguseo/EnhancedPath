/**
 * Created by Tyler on 7/8/2025.
 */

@IsTest
private class EnhancedPathControllerTest {
    @TestSetup
    static void setupData() {
        insert new PathAssistant__c(
            Name = 'Lead_Status',
            FieldApiName__c = 'Status',
            ObjectApiName__c = 'Lead',
            RecordTypeName__c = '__MASTER__',
            ExternalId__c = 'Lead_Status___MASTER__',
            IsActive__c = true
        );
        insert new PathAssistantStep__c(
            Name = 'New',
            PicklistValue__c = 'New',
            KeyFieldNames__c = 'Company,LastName',
            DependentFieldNames__c = 'Email,MobilePhone',
            RunFlow__c = true,
            FlowApiName__c = 'Test',
            PathAssistant__r = new PathAssistant__c(ExternalId__c = 'Lead_Status___MASTER__'),
            ExternalId__c = 'Lead_Status___MASTER___New'
        );
    }

    @IsTest
    static void shouldReturnStepsWithValidFlow() {
        Test.startTest();
        EnhancedPathController.VALID_FLOW_IDS_BY_API_NAME.put('Test', '301xx000000XyzA');
        List<EnhancedPathController.PathStep> steps = EnhancedPathController.getPathAssistantSteps(
            '__MASTER__',
            'Lead',
            'Status'
        );
        Test.stopTest();
        Assert.areEqual(1, steps.size(), 'Expected one path step to be returned');
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
        Assert.areEqual(true, steps[0].runFlow, 'Expected runFlow to be true');
        Assert.areEqual('Test', steps[0].flowApiName, 'Expected flowApiName to be Test');
        Assert.areEqual(true, steps[0].flowValid, 'Expected flowValid to be true');
    }

    @IsTest
    static void shouldReturnStepsWithInvalidFlow() {
        Test.startTest();
        List<EnhancedPathController.PathStep> steps = EnhancedPathController.getPathAssistantSteps(
            '__MASTER__',
            'Lead',
            'Status'
        );
        Test.stopTest();
        Assert.areEqual(1, steps.size(), 'Expected one path step to be returned');
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
        Assert.areEqual(true, steps[0].runFlow, 'Expected runFlow to be true');
        Assert.areEqual(null, steps[0].flowApiName, 'Expected flowApiName to be Test');
        Assert.areEqual(false, steps[0].flowValid, 'Expected flowValid to be true');
    }

    @IsTest
    static void shouldReturnEmptyList() {
        Test.startTest();
        List<EnhancedPathController.PathStep> steps = EnhancedPathController.getPathAssistantSteps('A', 'B', 'C');
        Test.stopTest();
        Assert.areEqual(0, steps.size(), 'Expected an empty list to be returned');
    }
}