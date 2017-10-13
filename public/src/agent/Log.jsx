import React from 'react';
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
                    <tr key={index} className="table-primary">
                        <td>&check;</td>
                        <td>{cpTime.toISOString()}</td>
                    </tr>                
                );

            case 'info':
                return (
                    <tr key={index}>
                        <td>{dur.toString()}</td>
                        <td>{entry.message}</td>
                    </tr>
                );

            case 'error':
                return (
                    <tr key={index} className="table-danger">
                        <td>{dur.toString()}</td>
                        <td>
                            <strong>Error</strong>
                            <pre>
                                {entry.message}
                            </pre>
                        </td>
                    </tr>
                );
        }

    });

    return (
        <div className="card">
            <div className="card-body">
                <h2>Activity</h2>
                <table className="table">
                    <thead>
                        <tr>
                        <th>&delta;</th>
                        <th>message</th>
                        </tr>
                    </thead>
                    <tbody>{entries}</tbody>
                </table>
            </div>        
        </div>
    );
}

export default Log;
