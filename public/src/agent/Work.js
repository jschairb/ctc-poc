import React from 'react';
import Card from './Card';

function Work(props) {

    if (!props.worker) {
        return <Card title="Work" subtitle="offline" />;
    }

    if (!props.worker.available && props.task) {
        return (
            <Card title="Work" subtitle={props.worker.activityName}>

                <dl className="dl-horizontal row">
                    <dt className="col-4">account name</dt>
                    <dd className="col-8">{props.task.attributes.accountName}</dd>
                </dl>

                <dl className="dl-horizontal row">
                    <dt className="col-sm-4">account number</dt>
                    <dd className="col-sm-8">{props.task.attributes.accountNumber}</dd>
                </dl>

                <dl className="dl-horizontal row">
                    <dt className="col-sm-4">contact name</dt>
                    <dd className="col-sm-8">{props.task.attributes.contactName}</dd>
                </dl>

                <dl className="dl-horizontal row">
                    <dt className="col-sm-4">contact number</dt>
                    <dd className="col-sm-8">{props.task.attributes.contactNumber}</dd>
                </dl>

                <dl className="dl-horizontal row">
                    <dt className="col-sm-4">phone number</dt>
                    <dd className="col-sm-8">{props.task.attributes.phoneNumber}</dd>
                </dl>

                <dl className="dl-horizontal row">
                    <dt className="col-sm-4">request reason</dt>
                    <dd className="col-sm-8">{props.task.attributes.requestReason}</dd>
                </dl>

                <dl className="dl-horizontal row">
                    <dt className="col-sm-4">ticket number</dt>
                    <dd className="col-sm-8">{props.task.attributes.ticketNumber}</dd>
                </dl>

            </Card>
        );
    }
    
    if (props.activities) {
        let options = props.activities.map(a => {
            // TODO can this match off sid? friendlyNames are unique?
            return <option key={a.sid} value={a.sid}>
                {a.friendlyName}
            </option>;
        });

        return (
            <Card title="Work" subtitle="on task">
                <select className="form-control" value={props.worker.activitySid} onChange={props.changeActivity}>
                    {options}
                </select>
            </Card>
        );
    }

    return (
        <Card title="Work" subtitle="loading" />
    );

}

export default Work;
