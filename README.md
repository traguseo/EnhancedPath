# Enhanced Path

[Install In Production](https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004jzRQAQ)

[Install In Sandbox](https://test.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004jzRQAQ)

## Details

Aims to replicate and further extend the functionality of the SF native Path component. Some standout features:

1. Syncs Key Fields and Guidance for Success from native SF Path Settings using the Metadata API
2. Dynamically resolves infinite levels of nested dependent picklist fields using LDS
3. Can define additional dependent fields for X picklist value using PathAssistantStep__c records
4. Can define a flow to launch when a user attempts to change to X pickist value using PathAssistantStep__c records, allowing for pre-commit validation

![demo](https://i.imgur.com/OH6UtPN.gif)
