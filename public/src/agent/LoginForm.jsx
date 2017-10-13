import React from 'react';
import Card from './Card.jsx';

class LoginForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {value: ''};

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit(event) {
        event.preventDefault();
        let user = this.state.value;
        console.log('logging in as', this.state.value);
        this.props.onSubmit(this.state.value);
    }

    render() {
        return (
            <Card title="Sign In">
                <form onSubmit={this.handleSubmit}>
                    <p>Login with the following agent names for different functionality.</p>

                    <dl className="dl-horizontal row">
                        <dt className="col-sm-3">directdial</dt>
                        <dd className="col-sm-9">accepts calls from the direct number.</dd>
                        <dt className="col-sm-3">agent </dt>
                        <dd className="col-sm-9">accepts calls from the ACD.</dd>
                    </dl>

                    <div className="input-group">
                        <input onChange={this.handleChange} type="text" className="form-control" placeholder="agent id" aria-label="agent id"/>
                        <span className="input-group-btn">
                            <input className="btn btn-secondary" type="submit" value="Login" />
                        </span>
                    </div>

                </form>
            </Card>
        );
    }
}

export default LoginForm;
