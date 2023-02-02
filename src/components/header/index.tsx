
import "./index.css"

import { Link } from "react-router-dom"

export function Header(props: {
    title: string;
}): JSX.Element {
    return (
        <div className="app-header">
            <div className="links">
                <Link to="/" className="link">Home</Link>
            </div>
            <div className="title">{props.title}</div>
        </div>
    )
}