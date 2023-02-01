
import "./index.css"

export function Header(props: {
    title: string;
    root: string;
}): JSX.Element {
    return (
        <div className="app-header">
            <div className="links">
                <a href={props.root} className="link">Home</a>
            </div>
            <div className="title">{props.title}</div>
        </div>
    )
}