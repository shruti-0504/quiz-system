import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/StudentDashboard.css";
import DarkModeToggle from "../components/DarkModeToggle";

const StudentDashboard = () => {
  const BASE_URL =
    process.env.REACT_APP_API_URL || "http://localhost:5000/student";

  const [user, setUser] = useState({ section: "", courses: [] });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const studentId = localStorage.getItem("registrationNumber");
  const studentSection = localStorage.getItem("section");
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (studentId) {
      refreshCourses();
      fetchQuizzes();
    }
  }, [studentId]);

  const refreshCourses = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/courses?registrationNumber=${studentId}`
      );
      if (!res.ok) throw new Error("Failed to fetch merged course data");

      const data = await res.json();

      const enrolled = data.allCourses.filter((course) =>
        data.enrolledCourseCodes.includes(course.courseCode)
      );

      const available = data.allCourses.filter(
        (course) => !data.enrolledCourseCodes.includes(course.courseCode)
      );

      setUser((prev) => ({ ...prev, section: data.section || "" }));
      setEnrolledCourses(enrolled);
      setAvailableCourses(available);
    } catch (err) {
      console.error("Failed to refresh courses:", err.message);
    }
  };

  const updateCourse = async (courseCode, action) => {
    try {
      await fetch(`${BASE_URL}/courses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber: studentId,
          courseCode,
          action,
        }),
      });
      await refreshCourses();
    } catch (error) {
      console.error(`${action} failed:`, error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/quizzes`, {
        params: {
          studentId: studentId, // or however you're storing it
          section: studentSection,
        },
      });
      setQuizzes(data);
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const registerForQuiz = async (quiz) => {
    try {
      await axios.post(`${BASE_URL}/register-quiz`, {
        studentRegNo: studentId,
        quizTitle: quiz.title,
        teacherRegNo: quiz.teacherRegNo,
      });
      await fetchQuizzes();
    } catch (err) {
      console.error(
        "Quiz registration error:",
        err.response?.data?.message || err.message
      );
      alert(err.response?.data?.message || "Failed to register");
    }
  };
  const QuizCard = ({ quiz, onRegister, context }) => {
    const canAttempt =
      quiz.canAttempt &&
      quiz.registrationStatus === "accepted" &&
      !quiz.hasAttempted;

    const handleActionClick = () => {
      if (onRegister) {
        registerForQuiz(quiz);
      } else if (canAttempt) {
        window.location.href = "/quiz";
      }
    };

    let actionButton = null;
    if (quiz.registrationStatus === "not_registered") {
      actionButton = <button onClick={handleActionClick}>Register</button>;
    } else if (quiz.registrationStatus === "pending") {
      actionButton = <span style={{ color: "orange" }}>Pending Approval</span>;
    } else if (quiz.registrationStatus === "rejected") {
      actionButton = <span style={{ color: "red" }}>Rejected</span>;
    } else if (quiz.registrationStatus === "accepted") {
      if (canAttempt) {
        actionButton = <button onClick={handleActionClick}>Attempt Now</button>;
      } else if (quiz.hasAttempted) {
        actionButton = <button disabled>Attempted</button>;
      } else {
        actionButton = <button disabled>Not Yet Started</button>;
      }
    }

    const renderDeadline = () => {
      if (context === "available" && quiz.RegEndTime) {
        return (
          <p>
            <strong>Registration Deadline:</strong>{" "}
            {new Date(quiz.RegEndTime).toLocaleString()}
          </p>
        );
      } else if (context === "registered" && quiz.endTime) {
        return (
          <p>
            <strong>Attempt Deadline:</strong>{" "}
            {new Date(quiz.endTime).toLocaleString()}
          </p>
        );
      }
      return null;
    };

    return (
      <div className="quiz-card">
        <h4>{quiz.title}</h4>
        {renderDeadline()}
        <div className="quiz-card-action">{actionButton}</div>
      </div>
    );
  };

  const attemptableQuizzes = quizzes.filter(
    (q) => q.canAttempt && !q.hasAttempted
  );
  const registerableQuizzes = quizzes.filter(
    (q) => q.canRegister && q.registrationStatus === "not_registered"
  );
  const registeredQuizzes = quizzes.filter((q) => q.isRegistered);
  const attemptedQuizzes = quizzes.filter((q) => q.hasAttempted);

  return (
    <div className="dashboard-container">
      <div className="header-top">
        <h1>Student Dashboard</h1>
        <DarkModeToggle />
      </div>

      <div className="nav-buttons">
        <Link to="/StudentDash">
          <button>Dashboard</button>
        </Link>
        <Link to="/quiz">
          <button>Quiz</button>
        </Link>
      </div>

      <p>Section: {user.section || studentSection || "Not assigned yet"}</p>

      <h3>Enrolled Courses:</h3>
      <ul>
        {enrolledCourses.length > 0 ? (
          enrolledCourses.map((course) => (
            <li key={course._id}>
              {course.courseName || "Unnamed Course"} (
              {course.courseCode || "No Code"})
              <button
                onClick={() => updateCourse(course.courseCode, "unenroll")}
              >
                Unenroll
              </button>
            </li>
          ))
        ) : (
          <p>Not enrolled in any courses.</p>
        )}
      </ul>

      <h3>Available Quizzes (Open for Registration)</h3>
      {registerableQuizzes.length === 0 ? (
        <p>No quizzes currently open for registration.</p>
      ) : (
        <ul>
          {registerableQuizzes.map((quiz) => (
            <QuizCard
              key={quiz._id}
              quiz={quiz}
              onRegister={registerForQuiz}
              context="available"
            />
          ))}
        </ul>
      )}

      <h3>Registered Quizzes</h3>
      {registeredQuizzes.length === 0 ? (
        <p>You haven't registered for any quizzes.</p>
      ) : (
        <ul>
          {registeredQuizzes.map((quiz) => (
            <QuizCard key={quiz._id} quiz={quiz} context="registered" />
          ))}
        </ul>
      )}

      <h3>Available Courses:</h3>
      <ul>
        {availableCourses.length > 0 ? (
          availableCourses.map((course) => (
            <li key={course._id}>
              {course.courseName || "Unnamed Course"} (
              {course.courseCode || "No Code"})
              <button onClick={() => updateCourse(course.courseCode, "enroll")}>
                Enroll
              </button>
            </li>
          ))
        ) : (
          <p>No courses available.</p>
        )}
      </ul>
    </div>
  );
};

export default StudentDashboard;
