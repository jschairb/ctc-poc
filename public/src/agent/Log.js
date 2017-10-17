import React from 'react';
import Card from './Card';
import * as time from '../time';

function Log(props) {

    let cpTime = props.loadTime;
    const entries = props.entries.map((entry, index) => {

        if (entry.level == 'checkpoint') {
            cpTime = entry.time;
        }

        let dur = new time.Duration(entry.time - cpTime);

        switch (entry.level) {
            case 'checkpoint':
                return (
                    <tr key={index} className="table-info log-checkpoint">
                        <td>&nbsp;</td>
                        <td>{cpTime.toISOString()}</td>
                    </tr>                
                );

            case 'info':
                return (
                    <tr key={index}>
                        <td>{dur.toString()}</td>
                        <td className="log-message">{entry.message}</td>
                    </tr>
                );

            case 'error':
                return (
                    <tr key={index} className="table-danger">
                        <td>{dur.toString()}</td>
                        <td className="log-message text-danger">{entry.message}</td>
                    </tr>
                );
        }

    });

    return (
        <Card title="Activity">
            <table className="table table-sm">
                <thead>
                    <tr>
                    <th>&delta;</th>
                    <th>message</th>
                    </tr>
                </thead>
                <tbody>{entries}</tbody>
            </table>
        </Card>

    );
}

export default Log;
