import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import { ThemeProvider } from "./components/ThemeContext.js";

function App() {
  const userRole = localStorage.getItem("role");
  return (
    <ThemeProvider>
      {
        <Router>
          {" "}
          {}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/quiz/:id"
              element={userRole === "student" ? <Quiz /> : <Navigate to="/" />}
            />
            <Route
              path="/quiz"
              element={userRole === "student" ? <Quiz /> : <Navigate to="/" />}
            />

            <Route
              path="/TeacherDash"
              element={
                userRole === "teacher" ? (
                  <TeacherDashboard />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/StudentDash"
              element={
                userRole === "student" ? (
                  <StudentDashboard />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </Router>
      }
    </ThemeProvider>
  );
}

export default App;
