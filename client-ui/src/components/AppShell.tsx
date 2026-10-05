import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

const studentNav = [
  ["Overview", "/student", "▦"], ["Assessments", "/student/assessments", "◉"], ["Skill Map", "/student/skill-map", "✦"],
  ["Readiness", "/student/readiness", "◎"], ["Daily Plan", "/student/daily-plan", "□"], ["Resume", "/student/resume", "▤"],
  ["AI Interview", "/student/ai-interview", "♩"], ["Applications", "/student/applications", "▣"],
];
const recruiterNav = [["Overview","/recruiter","▦"],["Candidates","/recruiter/candidates","◎"],["Jobs","/recruiter/jobs","▤"],["Applications","/recruiter/applications","▣"],["Analytics","/recruiter/analytics","◒"],["Company","/recruiter/company","▥"]];
const tpoNav = [["Overview","/tpo","▦"],["Students","/tpo/students","◎"],["Assessments","/tpo/assessments","◉"],["Placement Drives","/tpo/drives","▤"],["Companies","/tpo/companies","▥"],["Analytics","/tpo/analytics","◒"],["Reports","/tpo/reports","▧"]];

export default function AppShell({children, title, subtitle, role="STUDENT"}:{children:ReactNode; title:string; subtitle:string; role?:Role}) {
 const {user,logout}=useAuth(); const nav=role==="RECRUITER"?recruiterNav:role==="TPO"?tpoNav:studentNav; const loc=useLocation(); const navigate=useNavigate();
 return <div className="app-shell">
  <aside className="sidebar">
   <div className="brand"><div className="brand-mark">T</div><div><div className="brand-name">TalentBridge</div><div className="brand-sub">Placement Intelligence</div></div></div>
   <div className="role-label">{role === "TPO" ? "TPO / ADMIN" : role}</div>
   <nav className="nav-list">{nav.map(([label,path,icon])=><Link key={path} to={path} className={`nav-item ${loc.pathname===path?"active":""}`}><span className="nav-icon">{icon}</span><span>{label}</span></Link>)}</nav>
   <div className="sidebar-bottom"><Link to="/settings" className={`nav-item ${loc.pathname === "/settings" ? "active" : ""}`}><span className="nav-icon">⚙</span>Settings</Link><button className="nav-item logout" onClick={()=>{logout();navigate("/")}}><span className="nav-icon">↪</span>Log out</button><div className="user-mini"><div className="avatar">{(user?.name||"A").slice(0,1)}</div><div><b>{user?.name || "Aarav Mehta"}</b><span>{user?.email || "student@talentbridge.app"}</span></div></div></div>
  </aside>
  <main className="main-area">
   <header className="topbar"><div className="crumb">TalentBridge <span>/</span> {title}</div><div className="top-actions"><div className="search">⌕ <span>Search for jobs, assessments, skills...</span><kbd>⌘ K</kbd></div><button className="icon-btn">♧</button><div className="top-avatar">{(user?.name||"A").slice(0,1)}</div></div></header>
   <section className="content"><div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div></div>{children}</section>
  </main>
 </div>
}
