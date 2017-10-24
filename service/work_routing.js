class WorkRouting {
    constructor(twilioClient, accountSid, twilioNumber) {
        this.twilioClient = twilioClient;
        this.accountSid = accountSid;
        this.twilioNumber = twilioNumber;
    }

    createTask(workspaceSid, workflowSid, attributes) {
        return new Promise((resolve, reject) => {
            this.twilioClient.taskrouter.v1
                .workspaces(workspaceSid)
                .tasks
                .create({
                    workflowSid,
                    taskChannel: 'voice',
                    attributes: JSON.stringify(attributes),
                }).then(resolve, reject);
        });
    }

    loadTask(workspaceSid, taskSid) {
        return new Promise((resolve, reject) => {
            this.twilioClient.taskrouter.v1
                .workspaces(workspaceSid)
                .tasks(taskSid)
                .fetch()
                .then(resolve, reject);
        });
    }

    completeTask(workspaceSid, taskSid, reason) {
        return new Promise((resolve, reject) => {
            this.twilioClient.taskrouter.v1
                .workspaces(workspaceSid)
                .tasks(taskSid)
                .update({ assignmentStatus: 'completed', reason })
                .then(resolve, reject);
        });
    }
}

module.exports = WorkRouting;
