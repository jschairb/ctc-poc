import React from 'react';
import Card from './Card';
import * as state from './state';

function SoftPhone(props) {
    const handleClearClick = (e) => {
        e.preventDefault();
        props.clear();
    };

    const handleHoldCustomerClick = (e) => {
        e.preventDefault();
        props.holdCustomer();
    };

    switch (props.state) {
    case state.Call.OFFLINE:
        return <Card title="Soft Phone" subtitle="offline" />;

    case state.Call.CLEAR:
        return <Card title="Soft Phone" subtitle="clear" />;

    case state.Call.ALERTING:
        return <Card title="Soft Phone" subtitle="alerting" />;

    case state.Call.ESTABLISHED:
        return (
            <Card title="Soft Phone" subtitle="established">
                <p className="card-text">responding to call request</p>
                <button className="btn btn-danger" onClick={handleClearClick}>
                    Clear
                </button>

                <button className="btn btn-danger" onClick={handleHoldCustomerClick}>
                    Hold Customer
                </button>
            </Card>
        );

    default:
        throw new Error('unknown call state');
    }
}

export default SoftPhone;
