import React from 'react';
import Card from './Card';

import * as state from './state';

class Login extends React.Component {

    constructor(props) {
        super(props);
        this.state = { value: '' };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    handleSubmit(event) {
        event.preventDefault();
        let user = this.state.value;
        console.log('logging in as', this.state.value);
        this.props.onSubmit(this.state.value);
    }

    render() {
        switch (this.props.state) {
        case state.Login.OFFLINE:
            return (
                <Card title="Login" subtitle="sign in with your user name">
                    <form onSubmit={this.handleSubmit}>

                        <dl className="dl-horizontal row">
                            <dt className="col-sm-3">agent1</dt>
                            <dd className="col-sm-9">Sklled for <code>support</code> tasks.</dd>

                            <dt className="col-sm-3">agent2</dt>
                            <dd className="col-sm-9">
                                <p>Sklled for <code>support</code> & <code>special</code> tasks.</p>
                                <p>Special tasks can indicate a customer emergency.</p>
                            </dd>
                        </dl>

                        <div className="input-group">
                            <input
                                onChange={this.handleChange}
                                type="text"
                                className="form-control"
                                placeholder="agent id"
                                aria-label="agent id" />
                            <span className="input-group-btn">
                                <input
                                    className="btn btn-secondary"
                                    type="submit"
                                    value="login" />
                            </span>
                        </div>

                    </form>
                </Card>
            );

        case state.Login.CONNECTING:
            return <Card title="Login: connecting" subtitle={`connecting in as ${this.props.user}`} />;

        case state.Login.ONLINE:
            return <Card title="Login: online" subtitle={`signed in as ${this.props.user}`} />;

        default:
            return <Card title="Login: undefined" subtitle="undefined state" />;
        }
    }
}

export default Login;
