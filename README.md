# Enhanced Path
> The Salesforce Path component reimagined for every object, every field, and every use case.

Salesforce's native Path is powerful, but it's full of limitations and offers little room for customization. **Enhanced Path** breaks those limitations wide open.

Drop it on any Lightning Record Page, point it at any picklist field, and get a fully-featured guided selling and process enforcement experience complete with key fields, guidance for success, dependent field validation, flow-driven pre-commit logic, and even confetti. 🎉

Whether you're guiding reps through a lead status workflow, enforcing data quality gates on a custom object, or replacing a patchwork of validation rules and flows with a single clean component, Enhanced Path gives you the flexibility to build the process experience your org actually needs, all configured through custom metadata, no code required.

# Table of Contents
1. [Features](#features)
2. [Deployment & Setup Information](#deployment--setup-information)
   1. [YouTube Video Setup Guide](#youtube-video-demo--setup-guide)
   2. [EnhancedPathConfiguration__mdt Fields](#enhancedpathconfiguration-fields)
3. [Flow Input/Output Details and Overriding Toast Messages](#flow-inputoutput-details-and-overriding-toast-messages)
4. [How I Use This & The "Router Flow" Pattern](#how-i-use-this--the-router-flow-pattern)
5. [Migration To v1.2+](#migration-to-v12)

## Features

1. Works with any picklist field on any object and any record type
2. Syncs Key Fields and Guidance for Success from native SF Path Settings using the Metadata API
3. Dynamically resolves infinite levels of nested dependent picklist fields using LDS
4. Allows the admin to choose if users can hide/collapse the Key Field and Guidance for Success panel during configuration on the Lightning Record Page/Flexipage
5. Allows the admin to prevent backwards movement of the picklist field during configuration on the Lightning Record Page/Flexipage
6. Can define additional required dependent fields for X picklist value using the `DependentFieldNames__c` field, as well as optional fields using the `OptionalFieldNames__c` field on `EnhancedPathConfiguration__mdt` records
7. Can define a flow to launch when a user attempts to change to X pickist value using the `RunFlow__c` and `FlowApiName__c` fields on `EnhancedPathConfiguration__mdt` records, allowing for pre-commit validation
8. Can show confetti on successful update to X picklist value using the `ShowConfetti__c` field on `EnhancedPathConfiguration__mdt` records
9. Can group picklist values together to show as the last step on the path using the `IsGrouped__c` field on `EnhancedPathConfiguration__mdt` records and define if they are considered "lost" (causing them to render as red on the path instead of green) using the `IsLost__c` field
10. Detects [Nebula Logger](https://github.com/jongpie/NebulaLogger/tree/main) and logs errors using it if present

## Deployment & Setup Information

[Install In Production](https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL000000CsPdQAK)

[Install In Sandbox](https://test.salesforce.com/packaging/installPackage.apexp?p0=04tgL000000CsPdQAK)

1. After installing, you'll need to configure the component by creating `EnhancedPathConfiguration__mdt` records for the object(s), record type(s), picklist field(s), and picklist value(s) you want to use it with. There are a couple of ways to get those initial records in place:
   1. Run the `QueueableSyncPathAssistants` job once manually (anon apex snippet: `System.enqueueJob(new QueueableSyncPathAssistants());`)
   2. Schedule the `ScheduleQueueableSyncPathAssistants` job and wait for it to run
2. Assign the included  `Enhanced Path User` permission set out to relevant users
3. Create or update any `EnhancedPathConfiguration__mdt` records to configure any additional functionality for desired object + record type + picklist field combinations
4. Add the `Enhanced Path` component to the desired Lightning Record Page(s) and configure the component properties:
   1. Picklist Field API Name (e.g. `Status`)
   2. Grouping Label (only used if you have any `EnhancedPathConfiguration__mdt` records with `IsGrouped__c` set to `true`, and will be the label of the grouped step on the path bar)
   3. Allow users to hide/collapse the Key Fields and Guidance for Success panel (checkbox)
   4. Prevent users from moving backwards in the path (checkbox)

## YouTube Video Demo

+ [Click here to watch a video demo!](https://youtu.be/T0hWBvLec8E)

## EnhancedPathConfiguration Fields

| Field API Name              | Type | Required | Description                                                                                                                                                                                  |
|-----------------------------|---|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ObjectApiName__c`          | Text (255) | ✅ | The API name of the object this configuration record applies to (e.g. `Lead`)                                                                                                                |
| `FieldApiName__c`           | Text (255) | ✅ | The API name of the picklist field this configuration record applies to (e.g. `Status`)                                                                                                      |
| `RecordTypeApiName__c`      | Text (255) | ✅ | The Developer/API name of the record type this configuration scopes to. Use `__MASTER__` if your object has no record types.                                                                 |
| `PicklistApiValue__c`       | Text (255) | ✅ | The specific picklist API value this record represents                                                                                                                                       |
| `IsActive__c`               | Checkbox | ❌ | Whether this configuration record is active and should be used by the component                                                                                                              |
| `KeyFieldApiNames__c`       | Long Text Area | ❌ | Comma-separated list of field API names to display as **Key Fields** in the guidance panel for this picklist value                                                                           |
| `GuidanceForSuccess__c`     | Long Text Area | ❌ | The rich-text content to display as **Guidance for Success** in the guidance panel for this picklist value                                                                                   |
| `DependentFieldApiNames__c` | Long Text Area | ❌ | Comma-separated list of field API names treated as **required** dependent fields when moving to this picklist value (supplements native field dependencies)                                  |
| `OptionalFieldApiNames__c`  | Long Text Area | ❌ | Comma-separated list of field API names treated as **optional** dependent fields when moving to this picklist value (supplements native field dependencies)                                  |
| `FlowApiName__c`            | Text (255) | ❌ | The API name of the flow to run when moving to this picklist value. Running a flow is the highest priority. Field dependencies will not show if a flow is run.                               |
| `ShowConfetti__c`           | Checkbox | ❌ | Whether to display a confetti animation upon successfully saving this picklist value                                                                                                         |
| `IsGrouped__c`              | Checkbox | ❌ | Whether this picklist value should be grouped under the last step on the path bar (e.g. for Closed/Converted-type values). The grouped step label is configured on the Lightning Record Page |
| `IsLost__c`                 | Checkbox | ❌ | Used alongside `IsGrouped__c` — marks the value as a "lost" outcome, rendering the grouped step in **red** instead of green and not marking prior steps as complete                          |


> **NOTE:** The `DeveloperName` of each `EnhancedPathConfiguration__mdt` does not matter outside of the sync job. The sync job uses a standardized format to name each record but if you're managing them manually you can name them whatever makes sense for your org. There is no duplicate protection built into the custom metadata records, so be careful with having the sync job running on a schedule if you are planning to manage the `EnhancedPathConfiguration__mdt` records manually, as it can create duplicates if it runs and finds existing Path Settings that don't have a corresponding `EnhancedPathConfiguration__mdt` record with the expected `DeveloperName` format.

## Flow Input/Output Details and Overriding Toast Messages

1. The LWC always passes the same inputs to flow, these cannot be customized. They are 5 text variables and the expected names are: 
   1. `newValue`
   2. `oldValue`
   3. `fieldApiName`
   4. `objectApiName`
   5. `recordId`
2. The toast that is sent when a flow finishes can be controlled and customized using a boolean flow output variable named `enhancedPathOverride` and setting it's value to `true`. To customize the toast title, message, and variant use flow text output variables named `toastTitle`, `toastMessage`, and `toastVariant` [(see lightning-toast specs for list of variants)](https://developer.salesforce.com/docs/component-library/bundle/lightning-toast/specification)

>**NOTE:** There's a gotcha when using a combination of fault paths, subflows, and flow output variables!
>
> Make sure you set your output variables before the last screen the user sees if you're passing to subflows (especially if in a fault path), otherwise your output variables may not have the proper values passed back to the LWC. To account for this, I have a screen node at the end of all my flows that houses [another LWC included in the package](force-app/main/default/lwc/autoNextFlow/autoNextFlow.js) that automatically navigates the user past that screen, so that my outputs are always refreshed.

## How I Use This & The "Router Flow" Pattern

I have a flow for each object where I use the Enhanced Path component that I call a "router." The router is a simple flow that passes off to other subflows based on things like the `Record Type`, `newValue`, and `oldValue`.

All of my picklist values where I want to perform some pre-commit validation are configured via `EnhancedPathConfiguration__mdt` records that have the router flow as their `FlowApiName__c`.

This allows you to reuse most, if not all of your existing screen flows with the component, and only use the router flow to handle the logic of which flow to call when, based on the context of the record and picklist value.

## Migration To v1.2+

Versions 1.2 and above use the new `EnhancedPathConfigStep__mdt` Custom Metadata object for configuration options, instead of the `PathAssistant__c` and `PathAssistantStep__c` custom objects. 

This means that if you're an early adopter using a version before v1.2, you'll need to convert your existing `PathAssistant__c` and `PathAssistantStep__c` records to the new `EnhancedPathConfigStep__mdt` format. To do this, you can use [this anonymous apex script](https://gist.github.com/traguseo/d41fb46e292034f543ccaea4056b2eda) that will perform the conversion for you. If you have any issues please submit them on the repo and I'll be happy to help!

Once you've migrated your records, you can safely delete the `PathAssistant__c` and `PathAssistantStep__c` objects, as well as the `Enhanced Path Admin` permission set.