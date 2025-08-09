/**
 * Copyright (c) 2012, FinancialForce.com, inc
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 *   are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice,
 *      this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice,
 *      this list of conditions and the following disclaimer in the documentation
 *      and/or other materials provided with the distribution.
 * - Neither the name of the FinancialForce.com, inc nor the names of its contributors
 *      may be used to endorse or promote products derived from this software without
 *      specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
 *  THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 *  OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **/

/**
 * This is a dummy test class to obtain code coverage for the generated WSDL2Apex code, it is not a functional test class
 **/
@isTest
private class PathAssistantMetadataServiceTest {
    /**
     * Dummy Metadata API web service mock class (see MetadataCreateJobTest.cls for a better example)
     **/
    private class WebServiceMockImpl implements WebServiceMock {
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
            if (request instanceof PathAssistantMetadataService.retrieve_element)
                response.put('response_x', new PathAssistantMetadataService.retrieveResponse_element());
            else if (request instanceof PathAssistantMetadataService.checkDeployStatus_element)
                response.put('response_x', new PathAssistantMetadataService.checkDeployStatusResponse_element());
            else if (request instanceof PathAssistantMetadataService.listMetadata_element)
                response.put('response_x', new PathAssistantMetadataService.listMetadataResponse_element());
            else if (request instanceof PathAssistantMetadataService.checkRetrieveStatus_element)
                response.put('response_x', new PathAssistantMetadataService.checkRetrieveStatusResponse_element());
            else if (request instanceof PathAssistantMetadataService.describeMetadata_element)
                response.put('response_x', new PathAssistantMetadataService.describeMetadataResponse_element());
            else if (request instanceof PathAssistantMetadataService.deploy_element)
                response.put('response_x', new PathAssistantMetadataService.deployResponse_element());
            else if (request instanceof PathAssistantMetadataService.updateMetadata_element)
                response.put('response_x', new PathAssistantMetadataService.updateMetadataResponse_element());
            else if (request instanceof PathAssistantMetadataService.renameMetadata_element)
                response.put('response_x', new PathAssistantMetadataService.renameMetadataResponse_element());
            else if (request instanceof PathAssistantMetadataService.cancelDeploy_element)
                response.put('response_x', new PathAssistantMetadataService.cancelDeployResponse_element());
            else if (request instanceof PathAssistantMetadataService.deleteMetadata_element)
                response.put('response_x', new PathAssistantMetadataService.deleteMetadataResponse_element());
            else if (request instanceof PathAssistantMetadataService.upsertMetadata_element)
                response.put('response_x', new PathAssistantMetadataService.upsertMetadataResponse_element());
            else if (request instanceof PathAssistantMetadataService.createMetadata_element)
                response.put('response_x', new PathAssistantMetadataService.createMetadataResponse_element());
            else if (request instanceof PathAssistantMetadataService.deployRecentValidation_element)
                response.put('response_x', new PathAssistantMetadataService.deployRecentValidationResponse_element());
            else if (request instanceof PathAssistantMetadataService.describeValueType_element)
                response.put('response_x', new PathAssistantMetadataService.describeValueTypeResponse_element());
            else if (request instanceof PathAssistantMetadataService.checkRetrieveStatus_element)
                response.put('response_x', new PathAssistantMetadataService.checkRetrieveStatusResponse_element());
            return;
        }
    }

    @IsTest
    private static void coverGeneratedCodeCRUDOperations() {
        // Null Web Service mock implementation
        System.Test.setMock(WebServiceMock.class, new WebServiceMockImpl());
        // Only required to workaround a current code coverage bug in the platform
        PathAssistantMetadataService PathAssistantService = new PathAssistantMetadataService();
        // Invoke operations
        Test.startTest();
        PathAssistantMetadataService.MetadataPort metaDataPort = new PathAssistantMetadataService.MetadataPort();
        Test.stopTest();
    }

    @IsTest
    private static void coverGeneratedCodeFileBasedOperations1() {
        // Null Web Service mock implementation
        System.Test.setMock(WebServiceMock.class, new WebServiceMockImpl());
        // Only required to workaround a current code coverage bug in the platform
        PathAssistantMetadataService PathAssistantService = new PathAssistantMetadataService();
        // Invoke operations
        Test.startTest();
        PathAssistantMetadataService.MetadataPort metaDataPort = new PathAssistantMetadataService.MetadataPort();
        metaDataPort.retrieve(null);
        metaDataPort.checkDeployStatus(null, false);
        metaDataPort.listMetadata(null, null);
        metaDataPort.describeMetadata(null);
        metaDataPort.deploy(null, null);
        metaDataPort.checkDeployStatus(null, false);
        metaDataPort.updateMetadata(null);
        metaDataPort.renameMetadata(null, null, null);
        metaDataPort.cancelDeploy(null);
        Test.stopTest();
    }

    @IsTest
    private static void coverGeneratedCodeFileBasedOperations2() {
        // Null Web Service mock implementation
        System.Test.setMock(WebServiceMock.class, new WebServiceMockImpl());
        // Only required to workaround a current code coverage bug in the platform
        PathAssistantMetadataService PathAssistantService = new PathAssistantMetadataService();
        // Invoke operations
        Test.startTest();
        PathAssistantMetadataService.MetadataPort metaDataPort = new PathAssistantMetadataService.MetadataPort();
        metaDataPort.deleteMetadata(null, null);
        metaDataPort.upsertMetadata(null);
        metaDataPort.createMetadata(null);
        metaDataPort.deployRecentValidation(null);
        metaDataPort.describeValueType(null);
        metaDataPort.checkRetrieveStatus(null, null);
        Test.stopTest();
    }

    @IsTest
    private static void coverGeneratedCodeTypes() {
        // Reference types
        Test.startTest();
        new PathAssistantMetadataService();
        new PathAssistantMetadataService.listMetadataResponse_element();
        new PathAssistantMetadataService.checkDeployStatus_element();
        new PathAssistantMetadataService.CodeCoverageWarning();
        new PathAssistantMetadataService.DescribeMetadataResult();
        new PathAssistantMetadataService.LogInfo();
        new PathAssistantMetadataService.CallOptions_element();
        new PathAssistantMetadataService.describeMetadataResponse_element();
        new PathAssistantMetadataService.DeployMessage();
        new PathAssistantMetadataService.CodeCoverageResult();
        new PathAssistantMetadataService.describeMetadata_element();
        new PathAssistantMetadataService.ProfileObjectPermissions();
        new PathAssistantMetadataService.RetrieveResult();
        new PathAssistantMetadataService.retrieve_element();
        new PathAssistantMetadataService.DescribeMetadataObject();
        new PathAssistantMetadataService.RunTestSuccess();
        new PathAssistantMetadataService.deployResponse_element();
        new PathAssistantMetadataService.FileProperties();
        new PathAssistantMetadataService.AsyncResult();
        new PathAssistantMetadataService.checkRetrieveStatus_element();
        new PathAssistantMetadataService.RetrieveRequest();
        new PathAssistantMetadataService.ListMetadataQuery();
        new PathAssistantMetadataService.DebuggingHeader_element();
        new PathAssistantMetadataService.RunTestFailure();
        new PathAssistantMetadataService.listMetadata_element();
        new PathAssistantMetadataService.Metadata();
        new PathAssistantMetadataService.RetrieveMessage();
        new PathAssistantMetadataService.SessionHeader_element();
        new PathAssistantMetadataService.DeployOptions();
        new PathAssistantMetadataService.PackageTypeMembers();
        new PathAssistantMetadataService.deploy_element();
        new PathAssistantMetadataService.retrieveResponse_element();
        new PathAssistantMetadataService.checkRetrieveStatusResponse_element();
        new PathAssistantMetadataService.RunTestsResult();
        new PathAssistantMetadataService.CodeLocation();
        new PathAssistantMetadataService.DebuggingInfo_element();
        new PathAssistantMetadataService.Package_x();
        new PathAssistantMetadataService.DeployResult();
        new PathAssistantMetadataService.checkDeployStatusResponse_element();
        new PathAssistantMetadataService.renameMetadata_element();
        new PathAssistantMetadataService.deleteMetadataResponse_element();
        new PathAssistantMetadataService.Error();
        new PathAssistantMetadataService.SaveResult();
        new PathAssistantMetadataService.readMetadataResponse_element();
        new PathAssistantMetadataService.deleteMetadata_element();
        new PathAssistantMetadataService.createMetadataResponse_element();
        new PathAssistantMetadataService.updateMetadata_element();
        new PathAssistantMetadataService.updateMetadataResponse_element();
        new PathAssistantMetadataService.createMetadata_element();
        new PathAssistantMetadataService.readMetadata_element();
        new PathAssistantMetadataService.ReadResult();
        new PathAssistantMetadataService.DeployDetails();
        new PathAssistantMetadataService.renameMetadataResponse_element();
        new PathAssistantMetadataService.cancelDeploy_element();
        new PathAssistantMetadataService.CancelDeployResult();
        new PathAssistantMetadataService.cancelDeployResponse_element();
        new PathAssistantMetadataService.DeleteResult();
        new PathAssistantMetadataService.upsertMetadata_element();
        new PathAssistantMetadataService.upsertMetadataResponse_element();
        new PathAssistantMetadataService.UpsertResult();
        new PathAssistantMetadataService.deployRecentValidationResponse_element();
        new PathAssistantMetadataService.describeValueType_element();
        new PathAssistantMetadataService.deployRecentValidation_element();
        new PathAssistantMetadataService.DescribeValueTypeResult();
        new PathAssistantMetadataService.PicklistEntry();
        new PathAssistantMetadataService.ValueTypeField();
        new PathAssistantMetadataService.AllOrNoneHeader_element();
        new PathAssistantMetadataService.PathAssistantStep();
        new PathAssistantMetadataService.PathAssistant();
        Test.stopTest();
    }
}