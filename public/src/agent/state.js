const Login = {
    OFFLINE: Symbol('OFFLINE'),
    CONNECTING: Symbol('CONNECTING'),
    ONLINE: Symbol('ONLINE'),
}

const Call = {
    OFFLINE: Symbol('OFFLINE'),
    CLEAR: Symbol('CLEAR'),
    ALERTING: Symbol('ALERTING'),
    ESTABLISHED: Symbol('ESTABLISHED'),
}

export {
    Login,
    Call,
}
