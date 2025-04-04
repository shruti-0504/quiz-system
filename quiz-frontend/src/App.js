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
import TeacherQuiz from "./pages/TeacherQuiz";
import StudentQuiz from "./pages/StudentQuiz";

function App() {
  const userRole = localStorage.getItem("role");
  console.log("User Role:", userRole);
  return (
    <Router>
      {" "}
      {}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz/:id" element={<Quiz />} />
        <Route
          path="/TeacherDash"
          element={
            userRole === "teacher" ? <TeacherDashboard /> : <Navigate to="/" />
          }
        />
        <Route
          path="/StudentDash"
          element={
            userRole === "student" ? <StudentDashboard /> : <Navigate to="/" />
          }
        />
        <Route
          path="/TeacherQuiz"
          element={
            userRole === "teacher" ? <TeacherQuiz /> : <Navigate to="/" />
          }
        />
        <Route
          path="/StudentQuiz"
          element={
            userRole === "student" ? <StudentQuiz /> : <Navigate to="/" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
