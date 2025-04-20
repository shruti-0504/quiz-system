import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
  TextField,
  Paper,
} from "@mui/material";
import "../styles/TeacherDashboard.css";
import DarkModeToggle from "../components/DarkModeToggle";
import { useTheme } from "../components/ThemeContext.js"; // adjust the path if needed

const StudentDashboard = () => {
  const BASE_URL =
    process.env.REACT_APP_API_URL || "http://localhost:5000/student";

  const [user, setUser] = useState({ section: "", courses: [] });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const studentId = localStorage.getItem("registrationNumber");
  const studentSection = localStorage.getItem("section");
  const [quizzes, setQuizzes] = useState([]);
  const [loading, isLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("student-dashboard");

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
      isLoading(true);
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
      isLoading(false);
    }
  };
  console.log(quizzes);

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
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_, newValue) => {
    setTabIndex(newValue);
  };

  const QuizCard = ({ quiz, onSelect }) => {
    const getAction = () => {
      const now = new Date();

      const hasEnded = quiz.endTime && new Date(quiz.endTime) < now;
      const regClosed = quiz.RegEndTime && new Date(quiz.RegEndTime) < now;

      if (quiz.isAttempted || hasEnded) {
        return (
          <Button variant="contained" color="inherit" disabled>
            Attempted
          </Button>
        );
      }

      if (quiz.registrationStatus === "pending") {
        return (
          <Typography color="warning.main" fontWeight="bold">
            Pending Approval
          </Typography>
        );
      }

      if (quiz.registrationStatus === "rejected") {
        return (
          <Typography color="error.main" fontWeight="bold">
            Rejected
          </Typography>
        );
      }

      if (quiz.registrationStatus === "not_registered") {
        if (regClosed) {
          return (
            <Typography color="text.disabled" fontWeight="bold">
              Registration Closed
            </Typography>
          );
        }
      }
      return (
        <Button
          variant="contained"
          color="primary"
          onClick={() => onSelect(quiz)}
          sx={{
            color: "black",
            backgroundColor: "rgba(0, 0, 0, 0.12)",
          }}
        >
          Start Quiz
        </Button>
      );
    };

    return (
      <Card
        sx={{
          backgroundColor: darkMode ? "#1e1e1e" : "#cbcbcb",
          color: darkMode ? "#fff" : "#000",
          borderRadius: 3,
          boxShadow: 3,
          p: 3,
          my: 2,
          transition: "transform 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
          },
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {quiz.title}
          </Typography>
          <Typography variant="body2">
            <strong>Start:</strong> {new Date(quiz.startTime).toLocaleString()}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>End:</strong> {new Date(quiz.endTime).toLocaleString()}
          </Typography>
          <Box mt={2}>{getAction()}</Box>
        </CardContent>
      </Card>
    );
  };
  const handlePasswordSubmit = async () => {
    try {
      const response = await axios.post(
        `http://localhost:5000/student/verify-quiz/${selectedQuiz._id}`,
        { password }
      );

      if (response.data.success) {
        window.location.href = `/quiz/${selectedQuiz._id}`;
      } else {
        setError("Incorrect password. Try again.");
      }
    } catch (error) {
      setError("Failed to verify password. Try again.");
    }
  };
  const handleQuizSelect = (quiz) => {
    if (quiz.isAttempted) {
      setError("You have already attempted this quiz.");
      return;
    }
    setSelectedQuiz(quiz);
  };

  console.log("=== All Quizzes ===");
  quizzes.forEach((q) => {
    console.log(q.title, {
      hasAttempted: q.hasAttempted,
      isRegistered: q.isRegistered,
      appearsInAttempted: q.hasAttempted,
      appearsInRegistered: q.isRegistered && !q.hasAttempted,
    });
  });
  const attemptableQuizzes = quizzes.filter(
    (q) => q.canAttempt && !q.hasAttempted
  );
  const registerableQuizzes = quizzes.filter(
    (q) => q.canRegister && q.registrationStatus === "not_registered"
  );
  const attemptedQuizzes = quizzes.filter((q) => q.hasAttempted);

  const registeredQuizzes = quizzes.filter(
    (q) => q.isRegistered && !q.hasAttempted
  );
  console.log(
    "Attempted Quizzes:",
    attemptedQuizzes.map((q) => q.title)
  );
  console.log(
    "Registered Quizzes:",
    registeredQuizzes.map((q) => q.title)
  );

  return (
    <Box p={3}>
      <div className="teacher-dashboard">
        <div className="dashboard-header">
          <div className="header-top">
            <h1>Student Dashboard</h1>
            <DarkModeToggle />
          </div>

          <div className="navigation">
            <button
              onClick={() => setActiveTab("student-dashboard")}
              className={activeTab === "student-dashboard" ? "active" : ""}
            >
              Student Dashboard
            </button>

            <button
              onClick={() => setActiveTab("quiz")}
              className={activeTab === "quiz" ? "active" : ""}
            >
              Quiz
            </button>
          </div>
        </div>
        <Typography variant="body1" mb={2}>
          Section: {user.section || studentSection || "Not assigned yet"}
        </Typography>
        {activeTab === "student-dashboard" && (
          <Box>
            <Divider sx={{ my: 3 }} />
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              variant="scrollable"
            >
              <Tab label="Enrolled Courses" />
              <Tab label="Available Courses" />
              <Tab label="Available Quizzes" />
              <Tab label="Registered Quizzes" />
              <Tab label="Attempted Quizzes" />
            </Tabs>

            {tabIndex === 0 && (
              <>
                <Typography variant="h6" mt={2}>
                  Enrolled Courses:
                </Typography>
                <List>
                  {enrolledCourses.length > 0 ? (
                    enrolledCourses.map((course) => (
                      <ListItem
                        sx={{
                          borderBottom: "1px solid rgb(145, 145, 145)", // light gray border
                          paddingY: 1.5,
                        }}
                        key={course._id}
                        secondaryAction={
                          <Button
                            variant="outlined"
                            color="error"
                            sx={{
                              "&:hover": {
                                backgroundColor: "#ffebee", // light red shade for hover
                                borderColor: "#f44336", // optional: keep border on hover
                                color: "#d32f2f", // optional: darken text on hover
                              },
                            }}
                            onClick={() =>
                              updateCourse(course.courseCode, "unenroll")
                            }
                          >
                            Withdraw
                          </Button>
                        }
                      >
                        <ListItemText
                          primary={course.courseName || "Unnamed Course"}
                          secondary={`Code: ${course.courseCode || "N/A"}`}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography>No enrolled courses.</Typography>
                  )}
                </List>
              </>
            )}

            {tabIndex === 1 && (
              <>
                <Typography variant="h6" mt={2}>
                  Available Courses:
                </Typography>
                <List>
                  {availableCourses.length > 0 ? (
                    availableCourses.map((course, index) => (
                      <ListItem
                        sx={{
                          borderBottom: "1px solid rgb(143, 143, 143)", // light gray border
                          paddingY: 1.5,
                        }}
                        key={course._id}
                        secondaryAction={
                          <Button
                            variant="outlined"
                            sx={{
                              "&:hover": {
                                backgroundColor: "#ffebee", // light red shade for hover
                                borderColor: "#f44336", // optional: keep border on hover
                                color: "#d32f2f", // optional: darken text on hover
                              },
                            }}
                            onClick={() =>
                              updateCourse(course.courseCode, "enroll")
                            }
                          >
                            Enroll
                          </Button>
                        }
                      >
                        <ListItemText
                          primary={course.courseName || "Unnamed Course"}
                          secondary={`Code: ${course.courseCode || "N/A"}`}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography>No available courses.</Typography>
                  )}
                </List>
              </>
            )}

            {tabIndex === 2 && (
              <>
                <Typography variant="h6" mt={2}>
                  Available Quizzes (Open for Registration)
                </Typography>
                {registerableQuizzes.length === 0 ? (
                  <Typography>
                    No quizzes currently open for registration.
                  </Typography>
                ) : (
                  registerableQuizzes.map((quiz) => (
                    <QuizCard
                      key={quiz._id}
                      quiz={quiz}
                      onRegister={registerForQuiz}
                      context="available"
                    />
                  ))
                )}
              </>
            )}

            {tabIndex === 3 && (
              <>
                <Typography variant="h6" mt={2}>
                  Registered Quizzes
                </Typography>
                {registeredQuizzes.length === 0 ? (
                  <Typography>
                    You haven't registered for any quizzes.
                  </Typography>
                ) : (
                  registeredQuizzes.map((quiz) => (
                    <QuizCard key={quiz._id} quiz={quiz} context="registered" />
                  ))
                )}
              </>
            )}
            {tabIndex === 4 && (
              <>
                <Typography variant="h6" mt={2}>
                  Attempted Quizzes
                </Typography>
                {attemptedQuizzes.length === 0 ? (
                  <Typography>You haven't attempted any quizzes.</Typography>
                ) : (
                  attemptedQuizzes.map((quiz) => (
                    <QuizCard key={quiz._id} quiz={quiz} context="attempted" />
                  ))
                )}
              </>
            )}
          </Box>
        )}
        {activeTab === "quiz" && (
          <Box p={4}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            ></Box>
            <Typography variant="h5" mt={4} mb={2}>
              Available Quizzes
            </Typography>

            {attemptableQuizzes.length === 0 ? (
              <Typography color="text.secondary">
                No Attemptable Quizzes available at the moment.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {attemptableQuizzes.map((quiz) => (
                  <Grid item xs={12} md={6} lg={4} key={quiz._id}>
                    <QuizCard quiz={quiz} onSelect={handleQuizSelect} />
                  </Grid>
                ))}
              </Grid>
            )}

            {selectedQuiz && (
              <Paper sx={{ mt: 4, p: 3 }} elevation={3}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Enter Quiz Password
                </Typography>
                <TextField
                  fullWidth
                  type="password"
                  label="Enter password"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="success"
                  sx={{ mt: 2 }}
                  onClick={handlePasswordSubmit}
                >
                  Start Quiz
                </Button>
                {error && (
                  <Typography color="error" mt={2}>
                    {error}
                  </Typography>
                )}
              </Paper>
            )}
          </Box>
        )}
      </div>
    </Box>
  );
};
export default StudentDashboard;
