function getClientToken(agentName) {
    return new Promise((resolve, reject) => {
        $.getJSON('/client-token', { agentName: agentName })
            .done((resp) => {
                resolve(resp.token);
            })
            .fail((err) => {
                reject(error);
            })
    });
}

function getWorkerToken(agentName) {
    return new Promise((resolve, reject) => {
        $.getJSON('/worker-token', { agentName: agentName })
            .done((resp) => {
                resolve(resp.token);
            })
            .fail((err) => {
                reject(error);
            })
    });
}

export {
    getClientToken,
    getWorkerToken,
}
