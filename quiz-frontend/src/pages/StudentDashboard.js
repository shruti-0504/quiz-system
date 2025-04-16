import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Stack,
} from "@mui/material";
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
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_, newValue) => {
    setTabIndex(newValue);
  };

  const QuizCard = ({ quiz, onRegister, context }) => {
    const canAttempt =
      quiz.canAttempt &&
      quiz.registrationStatus === "accepted" &&
      !quiz.hasAttempted;

    const handleActionClick = () => {
      if (onRegister) {
        onRegister(quiz);
      } else if (canAttempt) {
        window.location.href = "/quiz";
      }
    };

    let actionButton;
    if (quiz.registrationStatus === "not_registered") {
      actionButton = (
        <Button variant="contained" color="primary" onClick={handleActionClick}>
          Register
        </Button>
      );
    } else if (quiz.registrationStatus === "pending") {
      actionButton = <Chip label="Pending Approval" color="warning" />;
    } else if (quiz.registrationStatus === "rejected") {
      actionButton = <Chip label="Rejected" color="error" />;
    } else if (quiz.registrationStatus === "accepted") {
      if (canAttempt) {
        actionButton = (
          <Button
            variant="contained"
            color="success"
            onClick={handleActionClick}
          >
            Attempt Now
          </Button>
        );
      } else if (quiz.hasAttempted) {
        actionButton = (
          <Button variant="outlined" disabled>
            Attempted
          </Button>
        );
      } else {
        actionButton = (
          <Button variant="outlined" disabled>
            Not Yet Started
          </Button>
        );
      }
    }

    const renderDeadline = () => {
      if (context === "available" && quiz.RegEndTime) {
        return `Registration Deadline: ${new Date(
          quiz.RegEndTime
        ).toLocaleString()}`;
      } else if (context === "registered" && quiz.endTime) {
        return `Attempt Deadline: ${new Date(quiz.endTime).toLocaleString()}`;
      }
      return null;
    };

    return (
      <Card sx={{ mb: 2, p: 2 }}>
        <CardContent>
          <Typography variant="h6">{quiz.title}</Typography>
          {renderDeadline() && (
            <Typography variant="body2" color="text.secondary" mt={1}>
              {renderDeadline()}
            </Typography>
          )}
          <Box mt={2}>{actionButton}</Box>
        </CardContent>
      </Card>
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
    <Box p={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Student Dashboard</Typography>
        <DarkModeToggle />
      </Stack>

      <Stack direction="row" spacing={2} mb={2}>
        <Link to="/StudentDash">
          <Button variant="outlined">Dashboard</Button>
        </Link>
        <Link to="/quiz">
          <Button variant="outlined">Quiz</Button>
        </Link>
      </Stack>

      <Typography variant="body1" mb={2}>
        Section: {user.section || studentSection || "Not assigned yet"}
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable">
        <Tab label="Enrolled Courses" />
        <Tab label="Available Courses" />
        <Tab label="Available Quizzes" />
        <Tab label="Registered Quizzes" />
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
                  key={course._id}
                  secondaryAction={
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        updateCourse(course.courseCode, "unenroll")
                      }
                    >
                      Unenroll
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
              availableCourses.map((course) => (
                <ListItem
                  key={course._id}
                  secondaryAction={
                    <Button
                      variant="contained"
                      onClick={() => updateCourse(course.courseCode, "enroll")}
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
            <Typography>No quizzes currently open for registration.</Typography>
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
            <Typography>You haven't registered for any quizzes.</Typography>
          ) : (
            registeredQuizzes.map((quiz) => (
              <QuizCard key={quiz._id} quiz={quiz} context="registered" />
            ))
          )}
        </>
      )}
    </Box>
  );
};

export default StudentDashboard;
