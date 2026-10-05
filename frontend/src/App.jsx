// =====================================================================
// App.jsx: all routes in one place.
// ---------------------------------------------------------------------
// Journeys
//   Child/Parent  /signup -> /choose-language -> /welcome -> /dashboard  (child view)
//                 child view : /dashboard, /learn/*, /passport
//                 parent view: /parent, /parent/profile
//   Normal        /signup -> /choose-language -> /welcome -> /dashboard, /learn/*, /profile
//   Teacher       /signup -> /welcome -> /teacher
//
// Layouts
//   MainLayout   site navbar + footer
//   LearnLayout  the learning paths' own top bar (no site navbar)
//   FocusLayout  logo only (welcome animation)
// Guards: src/routes/guards.jsx
// =====================================================================

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LEARNER_ROLES, ROLES, VIEWS } from "./config/roles.js";
import {
  PublicOnly,
  RequireAuth,
  RequireRole,
  RequireView,
  RequireWelcomed,
  WelcomeStep,
  ChooseLanguageStep,
} from "./routes/guards.jsx";
import { FocusLayout, MainLayout } from "./components/Layouts.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

// Public
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import AuthPage from "./pages/auth/AuthPage.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import WelcomePage from "./pages/auth/WelcomePage.jsx";
import ChooseLanguage from "./pages/auth/ChooseLanguage.jsx";
import NotFound from "./pages/NotFound.jsx";

// Learners (Child/Parent child view + Normal)
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import LearnLayout from "./pages/learn/LearnLayout.jsx";
import PathPage from "./pages/learn/PathPage.jsx";
import ModulePage from "./pages/learn/ModulePage.jsx";
import LessonView from "./pages/learn/LessonView.jsx";
import ModuleQuest from "./pages/learn/ModuleQuest.jsx";

// Profiles
import PassportPage from "./pages/profile/PassportPage.jsx";
import AccountProfile from "./pages/profile/AccountProfile.jsx";

// Parent view, teacher
import ParentOverview from "./pages/parent/ParentOverview.jsx";
import ParentUnlock from "./pages/parent/ParentUnlock.jsx";
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import ClassDetail from "./pages/teacher/ClassDetail.jsx";
import MyClasses from "./pages/learn/MyClasses.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div id="app">
          <Routes>
            {/* ================= Site pages (navbar + footer) ================= */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              <Route element={<PublicOnly />}>
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/signup" element={<AuthPage mode="signup" />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route element={<RequireWelcomed />}>
                  {/* Learners, child view */}
                  <Route element={<RequireRole roles={LEARNER_ROLES} />}>
                    <Route element={<RequireView view={VIEWS.CHILD} />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/classes" element={<MyClasses />} />
                    </Route>
                  </Route>

                  {/* Child/Parent: child profile */}
                  <Route element={<RequireRole roles={[ROLES.CHILD_PARENT]} />}>
                    <Route element={<RequireView view={VIEWS.CHILD} />}>
                      <Route path="/passport" element={<PassportPage />} />
                    </Route>
                    {/* Child/Parent: parent view */}
                    {/* Reachable from the child view: asks for the PIN */}
                    <Route path="/parent/unlock" element={<ParentUnlock />} />
                    <Route element={<RequireView view={VIEWS.PARENT} />}>
                      <Route path="/parent" element={<ParentOverview />} />
                      <Route path="/parent/profile" element={<AccountProfile />} />
                    </Route>
                  </Route>

                  {/* Normal: standard profile */}
                  <Route element={<RequireRole roles={[ROLES.NORMAL]} />}>
                    <Route path="/profile" element={<AccountProfile />} />
                  </Route>

                  {/* Teacher workspace */}
                  <Route element={<RequireRole roles={[ROLES.TEACHER]} />}>
                    <Route path="/teacher" element={<TeacherDashboard />} />
                    <Route path="/teacher/classes/:id" element={<ClassDetail />} />
                    <Route path="/teacher/profile" element={<AccountProfile />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ================= Learning paths (own layout) ================= */}
            <Route element={<RequireAuth />}>
              <Route element={<RequireWelcomed />}>
                <Route element={<RequireRole roles={LEARNER_ROLES} />}>
                  <Route element={<RequireView view={VIEWS.CHILD} />}>
                    <Route path="/learn" element={<LearnLayout />}>
                      <Route index element={<Navigate to="/learn/language" replace />} />
                      <Route path="language" element={<PathPage trackId="language" />} />
                      <Route path="culture" element={<PathPage trackId="culture" />} />
                      <Route path=":trackId/module/:moduleId" element={<ModulePage />} />
                    </Route>
                    {/* Focused players: full screen, no navigation */}
                    <Route path="/learn/:trackId/lesson/:lessonId" element={<LessonView />} />
                    <Route path="/learn/:trackId/module/:moduleId/quest" element={<ModuleQuest />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            {/* ================= Welcome animation (logo only) ================= */}
            <Route element={<RequireAuth />}>
              <Route element={<FocusLayout />}>
                <Route element={<ChooseLanguageStep />}>
                  <Route path="/choose-language" element={<ChooseLanguage />} />
                </Route>
                <Route element={<WelcomeStep />}>
                  <Route path="/welcome" element={<WelcomePage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
