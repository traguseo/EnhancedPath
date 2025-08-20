# Enhanced Path

[Install In Production](https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000005C5NQAU)

[Install In Sandbox](https://test.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000005C5NQAU)

## Details

Aims to replicate and further extend the functionality of the SF native Path component. Some standout features:

1. Syncs Key Fields and Guidance for Success from native SF Path Settings using the Metadata API
2. Dynamically resolves infinite levels of nested dependent picklist fields using LDS
3. Can define additional dependent fields for X picklist value using `PathAssistantStep__c` records
4. Can define a flow to launch when a user attempts to change to X pickist value using `PathAssistantStep__c` records, allowing for pre-commit validation

![demo](https://i.postimg.cc/pT616MKJ/chrome-BBbh-LZYu8b.gif)

## Setup Information

1. After installing, schedule the `ScheduleQueueableSyncPathAssistants` job (I use every hour, but you could do whatever makes sense for your Org -- post install script coming for this eventually)
2. Assign the included `Enhanced Path Admin` and `Enhanced Path User` permission sets out to relevant users
3. Create or update any `PathAssistant__c` and `PathAssistantStep__c` records to configure any additional functionality for desired object + record type + picklist field cominbations. Additonal functionality includes: requiring dependent fields other than picklists or running a flow

`PathAssistant__c` records have an external id field which is used for querying and upserting, the expected format is: `ObjectAPIName_FieldAPIName_RecordTypeName` (so for example, `Lead_Status___MASTER__`
`PathAssistantStep__c` records also have an external id field, the expected format concatenates the picklist value to the parent `PathAssistant__c`'s external id: `ObjectAPIName_FieldAPIName_RecordTypeName_PicklistValue` (so for example, `Lead_Status___MASTER__Converted - Business`)


## Flow Input/Output Details and Overriding Toast Messages

1. LWC always passes the same inputs to flow, these cannot be customized. They are 5 text variables and the expected names are: `newValue`, `oldValue`, `fieldApiName`, `objectApiName`, and `recordId`
2. The toast that is sent upon closure of a flow can be controlled and customized using a boolean flow output variable named `enhancedPathOverride` and setting it's value to true. To customize the toast title, message, and variant use flow text output variables named `toastTitle`, `toastMessage`, and `toastVariant` [(see lightning-toast specs for list of variants)](https://developer.salesforce.com/docs/component-library/bundle/lightning-toast/specification)
3. **There's a gotcha when using a combination of fault paths, subflows, and flow output variables. Make sure you set your output variables before the last screen the user sees if you're passing to subflows (especially if in a fault path), otherwise your output variables may not have the proper values passed back to the LWC.

## How I Use This

I have a "router" flow for each object where I use the Enhanced Path component. I then configure my `PathAssistantStep__c` records to have each picklist value where I want to perform some pre-commit validation using flow launch into this router flow.

In that router flow I then get the full record based on the `recordId` passed in, then make decisions based on things like `Record Type`, `newValue`, and `oldValue` to determine what subflow a user should be passed to when attempting to update X field on Y object to Z value. I'll then typically pass the full record around to the subflows to prevent further queries. At the end of the router flow and/or subflow I include an update node to set the picklist value to the `newValue` as the LWC will not update the picklist after passing off to a flow.


