/**
 * Created by Tyler on 7/11/2025.
 */

public with sharing class ScheduleQueueableSyncPathAssistants implements Schedulable {
    public void execute(SchedulableContext sc) {
        System.enqueueJob(new QueueableSyncPathAssistants());
    }
}