import React from 'react';

function Card(props) {
    return (
        <div className="card">
            <div className="card-body">
                <h4 className="card-title">{props.title}</h4>
                <h6 className="card-subtitle mb-2 text-muted">{props.subtitle}</h6>
                {props.children}
            </div>
        </div>
    );
}

export default Card;
