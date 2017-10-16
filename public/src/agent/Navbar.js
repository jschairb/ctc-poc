import React from 'react';

function Navbar(props) {
    const items = props.items.map((i, index) => {
        let cn = "nav-item";
        if (i.active) {
            cn += " active";
        }
        return (
            <li className={cn} key={index}>
                <a className="nav-link" href={i.href}>{i.text}</a>
            </li>
        );
    });

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-danger fixed-top">
            <a className="navbar-brand" href="#">{props.brand}</a>

            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav mr-auto">
                    {items}
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;
