import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import PlatformPage from "./pages/PlatformPages";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import StudentProfilePage from "./pages/StudentProfilePage";
import StudentProfileViewPage from "./pages/StudentProfileViewPage";
import StudentDashboard from "./pages/StudentDashboard";
import SettingsPage from "./pages/SettingsPage";
import TPOStudentsPage from "./pages/TPOStudentsPage";

import "./index.css";

const routes = [
  // =========================
  // STUDENT
  // =========================

  ["/student", "student-dashboard"],
  ["/student/assessments", "assessments"],
  ["/student/skill-map", "skill-map"],
  ["/student/readiness", "readiness"],
  ["/student/daily-plan", "daily-plan"],
  ["/student/resume", "resume"],
  ["/student/ai-interview", "interview"],
  ["/student/jobs", "jobs"],
  ["/student/job-details", "job-details"],
  ["/student/applications", "applications"],
  

  [
    "/student/assessment-instructions",
    "Assessment Instructions|Review rules, duration and scoring before you begin.",
  ],

  [
    "/student/assessment-attempt",
    "Assessment Attempt|Complete the assessment with a focused, distraction-free workspace.",
  ],

  [
    "/student/assessment-result",
    "Assessment Result|Review your score, strengths and improvement areas.",
  ],

  [
    "/student/skill-details",
    "Skill Details|Understand your proficiency, evidence and next learning step.",
  ],

  [
    "/student/learning",
    "Learning Recommendations|Personalized resources based on your current skill gaps.",
  ],

  [
    "/student/resume-result",
    "Resume Analysis Result|See your ATS score, gaps and recommended improvements.",
  ],

  [
    "/student/interview-session",
    "AI Interview Session|Complete your simulated interview round.",
  ],

  [
    "/student/interview-feedback",
    "AI Interview Feedback|Review communication, technical and behavioral feedback.",
  ],

  [
    "/student/application-details",
    "Application Details|Track every stage of your application.",
  ],

  [
    "/student/edit-profile",
    "Edit Profile|Update your personal, academic and placement information.",
  ],

  // =========================
  // RECRUITER
  // =========================

  ["/recruiter", "recruiter-dashboard"],

  [
    "/recruiter/candidates",
    "recruiter-candidates|Search verified candidates by skills, readiness and eligibility.",
  ],

  ["/recruiter/candidate", "recruiter-candidate"],

  ["/recruiter/create-job", "recruiter-create-job"],

  [
    "/recruiter/jobs",
    "recruiter-jobs|Manage open roles, eligibility and hiring timelines.",
  ],

  [
    "/recruiter/job-details",
    "recruiter-job-details|Review job requirements, applications and hiring activity.",
  ],

  [
    "/recruiter/filters",
    "recruiter-filters|Build precise candidate filters for your role.",
  ],

  [
    "/recruiter/assessment-results",
    "recruiter-assessment-results|Review candidate assessment evidence.",
  ],

  [
    "/recruiter/interview-results",
    "recruiter-interview-results|Review AI interview summaries and signals.",
  ],

  [
    "/recruiter/shortlist",
    "recruiter-shortlist|Manage candidates progressing to the next round.",
  ],

  [
    "/recruiter/applications",
    "recruiter-applications|Track applications through the hiring pipeline.",
  ],

  [
    "/recruiter/analytics",
    "recruiter-analytics|Understand candidate quality, funnel movement and skill demand.",
  ],

  [
    "/recruiter/company",
    "recruiter-company|Manage company profile and recruiter information.",
  ],

  // =========================
  // TPO
  // =========================

  ["/tpo", "tpo-dashboard"],

  ["/tpo/students", "tpo-students"],

  [
    "/tpo/student-details",
    "tpo-student-details|Review an individual student's readiness, academics and placement history.",
  ],

  [
    "/tpo/import",
    "tpo-import|Bulk import and validate student records.",
  ],

  [
    "/tpo/assessments",
    "tpo-assessments|Configure institution-wide assessments and participation.",
  ],

  [
    "/tpo/drives",
    "tpo-drives|Manage placement drives and hiring cycles.",
  ],

  ["/tpo/create-drive", "tpo-drive"],

  [
    "/tpo/drive-details",
    "tpo-drive-details|Review drive configuration, eligibility and candidate pipeline.",
  ],

  [
    "/tpo/eligibility",
    "tpo-eligibility|Define and review eligibility rules.",
  ],

  [
    "/tpo/eligible-students",
    "tpo-eligible-students|Review students who meet drive criteria.",
  ],

  [
    "/tpo/companies",
    "tpo-companies|Manage participating companies and recruiter contacts.",
  ],

  [
    "/tpo/applications",
    "tpo-applications|Track applications across active drives.",
  ],

  [
    "/tpo/shortlisting",
    "tpo-shortlisting|Manage institutional shortlists and approvals.",
  ],

  [
    "/tpo/interview-rounds",
    "tpo-interview-rounds|Configure interview rounds and schedules.",
  ],

  [
    "/tpo/results",
    "tpo-results|Record and review round results.",
  ],

  [
    "/tpo/final-selection",
    "tpo-final-selection|Review final selection and placement outcomes.",
  ],

  [
    "/tpo/analytics",
    "tpo-analytics|Readiness, skill-gap and placement analytics.",
  ],

  [
    "/tpo/skill-gaps",
    "tpo-skill-gaps|Identify the most important institution-wide skill gaps.",
  ],

  [
    "/tpo/at-risk",
    "tpo-at-risk|Find students who need additional placement support.",
  ],

  [
    "/tpo/statistics",
    "tpo-statistics|Review placement statistics by batch, branch and company.",
  ],

  [
    "/tpo/reports",
    "tpo-reports|Generate placement and readiness reports.",
  ],

  // =========================
  // SHARED AUTHENTICATED
  // =========================

  [
    "/settings",
    "settings|Manage account, privacy, notifications and security.",
  ],

  [
    "/notifications",
    "notifications|Review assessment reminders, applications and placement announcements.",
  ],
];

const studentRoutes = routes.filter(([path]) =>
  path.startsWith("/student")
);

const recruiterRoutes = routes.filter(([path]) =>
  path.startsWith("/recruiter")
);

const tpoRoutes = routes.filter(([path]) =>
  path.startsWith("/tpo")
);

const sharedRoutes = routes.filter(
  ([path]) =>
    path === "/settings" ||
    path === "/notifications"
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* =========================
              PUBLIC ROUTES
          ========================= */}

          <Route
            path="/"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />


          {/* =========================
              STUDENT ROUTES
          ========================= */}

          <Route
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]} />
            }
          >
          <Route
            path="/student/onboarding"
            element={<StudentProfilePage />}
          />

          <Route
            path="/student/profile"
            element={<StudentProfileViewPage />}
          />

          <Route
            path="/student/edit-profile"
            element={<StudentProfilePage />}
          />
            {studentRoutes.map(([path, kind]) => (
              <Route
                key={path}
                path={path}
                element={path === "/student" ? <StudentDashboard /> : <PlatformPage kind={kind} />}
              />
            ))}
          </Route>


          {/* =========================
              RECRUITER ROUTES
          ========================= */}

          <Route
            element={
              <ProtectedRoute allowedRoles={["RECRUITER"]} />
            }
          >
            {recruiterRoutes.map(([path, kind]) => (
              <Route
                key={path}
                path={path}
                element={<PlatformPage kind={kind} />}
              />
            ))}
          </Route>


          {/* =========================
              TPO ROUTES
          ========================= */}

          <Route
            element={
              <ProtectedRoute allowedRoles={["TPO"]} />
            }
          >
            {tpoRoutes.map(([path, kind]) => (
              <Route
                key={path}
                path={path}
                element={
                  path === "/tpo/students" ? (
                    <TPOStudentsPage />
                  ) : (
                    <PlatformPage kind={kind} />
                  )
                }
              />
            ))}
          </Route>


          {/* =========================
              SHARED AUTHENTICATED
          ========================= */}

          <Route
            element={
              <ProtectedRoute />
            }
          >
            {sharedRoutes.map(([path, kind]) => (
              <Route
                key={path}
                path={path}
                element={
                  path === "/settings" ? (
                    <SettingsPage />
                  ) : (
                    <PlatformPage kind={kind} />
                  )
                }
              />
            ))}
          </Route>


          {/* =========================
              FALLBACK
          ========================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}