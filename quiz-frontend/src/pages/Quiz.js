import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  TextField,
  CircularProgress,
  Paper,
} from "@mui/material";
import DarkModeToggle from "../components/DarkModeToggle";
import { useTheme } from "../components/ThemeContext.js"; // adjust the path if needed

import { useParams } from "react-router-dom";
let tabSwitchCount = 0;
let quizForceSubmitted = false; // renamed for clarity

const handleBeforeUnload = (e) => {
  if (quizForceSubmitted) return;
  e.preventDefault();
  e.returnValue = "";
};

const handleVisibilityChange = () => {
  if (quizForceSubmitted) return;

  if (document.hidden) {
    tabSwitchCount++;
    alert("Please don't switch tabs during the quiz!");

    if (tabSwitchCount === 2) {
      alert("Warning: Next tab-switch will auto-submit your quiz.");
    }

    if (tabSwitchCount >= 3) {
      alert("Auto-submitting quiz due to multiple tab switches...");
      window.dispatchEvent(new CustomEvent("forceSubmitQuiz"));
    }
  }
};

const Quiz = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [password, setPassword] = useState("");
  const [answers, setAnswers] = useState({});
  const answersRef = useRef({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const studentId = localStorage.getItem("registrationNumber");
  const studentSection = localStorage.getItem("section");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [markedForReview, setMarkedForReview] = useState({});
  const hasSubmitted = useRef(false);
  const { darkMode } = useTheme();

  useEffect(() => {
    fetchAvailableQuizzes();
  }, []);

  const fetchAvailableQuizzes = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/student/quizzes?studentId=${studentId}&section=${studentSection}`
      );
      // Filter the quizzes after they are fetched
      const attemptableQuizzes = response.data.filter(
        (q) => q.canAttempt && !q.hasAttempted
      );

      setQuizzes(attemptableQuizzes); // Set the filtered quizzes to state
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  const handleQuizSelect = (quiz) => {
    if (quiz.isAttempted) {
      setError("You have already attempted this quiz.");
      return;
    }
    setSelectedQuiz(quiz);
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

  // Fetch quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      if (!id) {
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/student/quiz/${id}`);
        const data = await res.json();
        if (res.ok) {
          setQuiz(data.quiz);
          const startTime = new Date(data.quiz.startTime).getTime();
          const endTime = new Date(data.quiz.endTime).getTime();
          const now = new Date().getTime();
          const durationLeft = Math.max(endTime - now, 0);
          setTimeLeft(Math.min(data.quiz.duration * 60 * 1000, durationLeft));
        } else {
          setError(data.message || "Failed to fetch quiz!");
        }
      } catch (err) {
        setError("Error fetching quiz! Please try again.");
      }
      setLoading(false);
    };

    fetchQuiz();
  }, [id]);

  // Handle answer change
  const handleAnswerChange = (questionIndex, selectedOption) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionIndex]: selectedOption };
      answersRef.current = updated;
      return updated;
    });
  };

  // Submit quiz
  const handleSubmit = async () => {
    if (loading || hasSubmitted.current) return;

    hasSubmitted.current = true;
    quizForceSubmitted = true; // 🔥 global switch = no more alerts

    // Remove any remaining listeners
    window.removeEventListener("beforeunload", handleBeforeUnload);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("forceSubmitQuiz", handleSubmit);
    window.onbeforeunload = null;

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/student/submit-quiz/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answersRef.current, studentId }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Quiz submitted successfully!");
        setQuiz(null);
        setAnswers({});
        setTimeout(() => {
          window.location.href = "/quiz";
        }, 300); // give alert time to close
      } else {
        setError(data.message || "Error submitting quiz!");
      }
    } catch (err) {
      setError("Error submitting quiz! Please try again.");
    }

    setLoading(false);
  };

  // Timer logic
  useEffect(() => {
    if (!quiz || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          setTimeout(() => handleSubmit(), 100); // tiny delay ensures latest state
          return 0;
        }

        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);
  useEffect(() => {
    if (!quiz || quizForceSubmitted) return;

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const forceSubmitListener = () => {
      handleSubmit(); // full cleanup happens inside
    };
    window.addEventListener("forceSubmitQuiz", forceSubmitListener);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("forceSubmitQuiz", forceSubmitListener);
    };
  }, [quiz]);

  const QuizCard = ({ quiz, onSelect }) => {
    const getAction = () => {
      if (quiz.isAttempted) {
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
        return (
          <Typography color="text.disabled" fontWeight="bold">
            Not Registered
          </Typography>
        );
      }
      return (
        <Button
          variant="contained"
          color="primary"
          onClick={() => onSelect(quiz)}
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

  function dotStyle(color) {
    return {
      display: "inline-block",
      width: "16px",
      height: "16px",
      backgroundColor: color,
      borderRadius: "4px",
      marginRight: "8px",
      verticalAlign: "middle",
    };
  }

  if (!quiz) {
    return (
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Quiz Portal</Typography>
          <DarkModeToggle />
        </Box>
        <Typography variant="h5" mt={4} mb={2}>
          Available Quizzes
        </Typography>

        {quizzes.length === 0 ? (
          <Typography color="text.secondary">
            No available quizzes at the moment.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {quizzes.map((quiz) => (
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
    );
  }

  return (
    <Box display="flex" p={3}>
      {/* Left Panel - Quiz Content */}
      <Box flex={1}>
        {loading && <CircularProgress />}
        {error && (
          <Typography color="error" mb={2}>
            {error}
          </Typography>
        )}
        {quiz && (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h5" fontWeight="bold">
                {quiz.title}
              </Typography>
              <DarkModeToggle />
            </Box>

            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color={timeLeft <= 60000 ? "error.main" : "text.primary"}
              mb={2}
            >
              ⏳ Time Left: {Math.floor(timeLeft / 60000)}m{" "}
              {Math.floor((timeLeft % 60000) / 1000)}s
            </Typography>

            <Box>
              <Typography variant="h6" gutterBottom>
                {quiz.questions[currentIndex].questionText}
              </Typography>
              {quiz.questions[currentIndex].options.map((option, optIndex) => (
                <Box key={optIndex} mb={1}>
                  <label>
                    <input
                      type="radio"
                      name={`q${currentIndex}`}
                      value={optIndex}
                      checked={answers[currentIndex] === optIndex}
                      onChange={() =>
                        handleAnswerChange(currentIndex, optIndex)
                      }
                    />{" "}
                    {option}
                  </label>
                </Box>
              ))}
            </Box>

            <Button
              variant="outlined"
              sx={{ mt: 2, mr: 2 }}
              onClick={() =>
                setMarkedForReview((prev) => ({
                  ...prev,
                  [currentIndex]: !prev[currentIndex],
                }))
              }
            >
              {markedForReview[currentIndex]
                ? "Unmark Review"
                : "Mark for Review"}
            </Button>

            <Box mt={2}>
              {currentIndex > 0 &&
                (!answers[currentIndex - 1] ||
                  markedForReview[currentIndex - 1]) && (
                  <Button
                    variant="contained"
                    sx={{ mr: 1 }}
                    onClick={() => setCurrentIndex(currentIndex - 1)}
                  >
                    Previous
                  </Button>
                )}

              {currentIndex < quiz.questions.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit}
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Box>
      {/* Right Panel - Sidebar */}
      <Box
        sx={{
          width: "250px", // increase width
          ml: 2, // margin-left instead of margin-right
        }}
      >
        {quiz?.questions?.length === 0 ? (
          <Typography>No questions available in this quiz.</Typography>
        ) : (
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(50px, 1fr))"
            gap={1}
          >
            {quiz?.questions?.map((_, index) => {
              let bgColor = "#ffffff";
              let color = "#000";
              if (markedForReview[index] && index in answers) {
                bgColor = "#b19cd9";
              } else if (markedForReview[index]) {
                bgColor = "#ffb347";
              } else if (index in answers) {
                bgColor = "#90ee90";
              } else if (index === currentIndex) {
                bgColor = "#add8e6";
              } else if (index < currentIndex) {
                bgColor = "#fdd835";
              }

              return (
                <Box
                  key={index}
                  onClick={() => {
                    const isUnanswered = !answers[index];
                    const isMarked = markedForReview[index];
                    if (index === currentIndex || isUnanswered || isMarked) {
                      setCurrentIndex(index);
                    }
                  }}
                  sx={{
                    padding: "6px",
                    backgroundColor: bgColor,
                    color: color,
                    borderRadius: "6px",
                    textAlign: "center",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Q{index + 1}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Legend */}
        <Box mt={3} fontSize="14px">
          <Typography>
            <span style={dotStyle("#90ee90")}></span> Answered
          </Typography>
          <Typography>
            <span style={dotStyle("#ffb347")}></span> Marked for Review
          </Typography>
          <Typography>
            <span style={dotStyle("#b19cd9")}></span> Answered + Marked
          </Typography>
          <Typography>
            <span style={dotStyle("#fdd835")}></span> Visited but Unanswered
          </Typography>
          <Typography>
            <span style={dotStyle("#add8e6")}></span> Current Question
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Quiz;
