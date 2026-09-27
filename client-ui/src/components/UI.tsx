import type { ReactNode } from "react";
export function Card({children,className=""}:{children:ReactNode;className?:string}){return <div className={`ui-card ${className}`}>{children}</div>}
export function Stat({label,value,meta,tone="purple"}:{label:string;value:string|number;meta?:string;tone?:string}){return <Card className="stat"><span className="eyebrow">{label}</span><strong>{value}</strong>{meta&&<small className={tone}>{meta}</small>}</Card>}
export function Badge({children,tone="purple"}:{children:ReactNode;tone?:string}){return <span className={`badge ${tone}`}>{children}</span>}
export function Progress({value,tone="purple"}:{value:number;tone?:string}){return <div className="progress"><span className={tone} style={{width:`${value}%`}}/></div>}
export function Button({children,variant="primary",onClick}:{children:ReactNode;variant?:"primary"|"secondary";onClick?:()=>void}){return <button onClick={onClick} className={`btn ${variant}`}>{children}</button>}
export function SectionTitle({title,sub,action}:{title:string;sub?:string;action?:ReactNode}){return <div className="section-title"><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>{action}</div>}
export function Empty({title,body}:{title:string;body:string}){return <Card className="empty"><div className="empty-icon">✦</div><h3>{title}</h3><p>{body}</p><Button>Get started</Button></Card>}
