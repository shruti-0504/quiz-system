import { useEffect, useState, useRef } from "react";
import { Typography, Button, Box, CircularProgress } from "@mui/material";
import DarkModeToggle from "../components/DarkModeToggle";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
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
  const [answers, setAnswers] = useState({});
  const answersRef = useRef({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const studentId = localStorage.getItem("registrationNumber");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [markedForReview, setMarkedForReview] = useState({});
  const hasSubmitted = useRef(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [timerPaused, setTimerPaused] = useState(true);
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
          window.location.href = "/studentDash";
        }, 300);
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
    if (!quiz || timeLeft <= 0 || timerPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          setTimeout(() => handleSubmit(), 100);
          return 0;
        }

        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, timeLeft, timerPaused]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);

  useEffect(() => {
    if (!quiz || quizForceSubmitted) return;

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const forceSubmitListener = () => {
      handleSubmit();
    };
    window.addEventListener("forceSubmitQuiz", forceSubmitListener);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("forceSubmitQuiz", forceSubmitListener);
    };
  }, [quiz]);

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

  return (
    <Box display="flex" p={3}>
      {/* Left Panel - Quiz Content */}
      <Dialog open={showInstructions}>
        <DialogTitle>📘 Quiz Instructions</DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemText>
                Navigation: You can move forward/backward to change answers.
              </ListItemText>
            </ListItem>

            <ListItem>
              <ListItemText>
                You can only move to a question if it's unanswered or marked for
                review.
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                The right panel shows question statuses with color codes:
              </ListItemText>
            </ListItem>

            {/* Color code explanation */}
            <ListItem>
              <Box
                width={16}
                height={16}
                mr={1}
                bgcolor="#90ee90"
                borderRadius={1}
              />
              <ListItemText primary="Answered (Green)" />
            </ListItem>
            <ListItem>
              <Box
                width={16}
                height={16}
                mr={1}
                bgcolor="#ffb347"
                borderRadius={1}
              />
              <ListItemText primary="Marked for Review (Orange)" />
            </ListItem>
            <ListItem>
              <Box
                width={16}
                height={16}
                mr={1}
                bgcolor="#b19cd9"
                borderRadius={1}
              />
              <ListItemText primary="Marked & Answered (Purple)" />
            </ListItem>
            <ListItem>
              <Box
                width={16}
                height={16}
                mr={1}
                bgcolor="#fdd835"
                borderRadius={1}
              />
              <ListItemText primary="Visited (Yellow)" />
            </ListItem>
            <ListItem>
              <Box
                width={16}
                height={16}
                mr={1}
                bgcolor="#add8e6"
                borderRadius={1}
              />
              <ListItemText primary="Current (Blue)" />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="⚠️ Do NOT switch tabs — Auto-submit after 3 switches."
                primaryTypographyProps={{ color: "error" }}
              />
            </ListItem>
          </List>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setShowInstructions(false);
              setTimerPaused(false); // ✅ Start timer now
            }}
            variant="contained"
          >
            Start Quiz
          </Button>
        </DialogActions>
      </Dialog>

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
              sx={{
                backgroundColor: "#3f51b5",
                color: "white",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                textAlign: "center",

                // Manually target dark mode class on body
                "@media (prefers-color-scheme: dark), body.dark-mode &": {
                  backgroundColor: "#1a237e",
                  backgroundImage:
                    "linear-gradient(to right, #1a237e, #283593)",
                },
              }}
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
