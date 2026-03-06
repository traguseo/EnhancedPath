# Enhanced Path

[Install In Production](https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL000000CCAHQA4)

[Install In Sandbox](https://test.salesforce.com/packaging/installPackage.apexp?p0=04tgL000000CCAHQA4)

## Details

Aims to replicate and further extend the functionality of the SF native Path component. Features:

1. Syncs Key Fields and Guidance for Success from native SF Path Settings using the Metadata API
2. Dynamically resolves infinite levels of nested dependent picklist fields using LDS
3. Allows the admin to choose if users can hide/collapse the Key Field and Guidance for Success panel during configuration on the Lightning Record Page/Flexipage
4. Can define additional dependent fields for X picklist value using the `DependentFieldNames__c` field on `PathAssistantStep__c` records
5. Can define a flow to launch when a user attempts to change to X pickist value using the `RunFlow__c` and `FlowApiName__c` fields on `PathAssistantStep__c` records, allowing for pre-commit validation
6. Can show confetti on successful update to X picklist value using the `ShowConfetti__c` field on `PathAssistantStep__c` records
7. Can group picklist values together to show as the last step on the path using the `IsGrouped__c` field on `PathAssistantStep__c` records and define if they are considered "lost" (causing them to render as red on the path instead of green) using the `IsLost__c` field
8. Detects [Nebula Logger](https://github.com/jongpie/NebulaLogger/tree/main) and logs errors using it if present

![demo](https://lh3.googleusercontent.com/d/1SaWH8cJyeASTo1vnya67pp7wDEX1ObaH)

## Setup Information

1. After installing, schedule the `ScheduleQueueableSyncPathAssistants` job (I use every hour, but you could do whatever makes sense for your Org)
2. Run the `QueueableSyncPathAssistants` job once manually (or wait for your scheduled job to run) to sync all existing Path Settings to the `PathAssitant__c` and `PathAssistantStep__c` objects (anon apex snippet: `System.enqueueJob(new QueueableSyncPathAssistants())`)
3. Assign the included `Enhanced Path Admin` and `Enhanced Path User` permission sets out to relevant users
4. Create or update any `PathAssistant__c` and `PathAssistantStep__c` records to configure any additional functionality for desired object + record type + picklist field cominbations. Additonal functionality includes: requiring dependent fields other than picklists or running a flow

`PathAssistant__c` records have an external id field which is used for querying and upserting, the expected format is: `ObjectAPIName_FieldAPIName_RecordTypeName` (so for example, `Lead_Status___MASTER__`)

`PathAssistantStep__c` records also have an external id field, the expected format concatenates the picklist value to the parent `PathAssistant__c`'s external id: `ObjectAPIName_FieldAPIName_RecordTypeName_PicklistValue` (so for example, `Lead_Status___MASTER__Converted - Business`)


## Flow Input/Output Details and Overriding Toast Messages

1. LWC always passes the same inputs to flow, these cannot be customized. They are 5 text variables and the expected names are: `newValue`, `oldValue`, `fieldApiName`, `objectApiName`, and `recordId`
2. The toast that is sent when a flow finishes can be controlled and customized using a boolean flow output variable named `enhancedPathOverride` and setting it's value to true. To customize the toast title, message, and variant use flow text output variables named `toastTitle`, `toastMessage`, and `toastVariant` [(see lightning-toast specs for list of variants)](https://developer.salesforce.com/docs/component-library/bundle/lightning-toast/specification)

**NOTE: There's a gotcha when using a combination of fault paths, subflows, and flow output variables:**

Make sure you set your output variables before the last screen the user sees if you're passing to subflows (especially if in a fault path), otherwise your output variables may not have the proper values passed back to the LWC. To account for this, I have a screen node at the end of all my flows that houses [another LWC](https://gist.github.com/traguseo/9221823ada4f9fa316833740bb795c62) that automatically navigates the user past that screen, so that my outputs are always refreshed.

## How I Use This

I have a "router" flow for each object where I use the Enhanced Path component. I then configure my `PathAssistantStep__c` records to have each picklist value where I want to perform some pre-commit validation using flow launch into this router flow.

In that router flow I then get the full record based on the `recordId` passed in, then make decisions based on things like `Record Type`, `newValue`, and `oldValue` to determine what subflow a user should be passed to when attempting to update X field on Y object to Z value. I'll then typically pass the full record around to the subflows to prevent further queries. At the end of the router flow and/or subflow I include an update node to set the picklist value to the `newValue` as the LWC will not update the picklist after passing off to a flow.

## Planned Features

1. Define optional fields using a new field on `PathAssistantStep__c` records and show them on the dependent fields modal
