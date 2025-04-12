import { useEffect, useState, useRef } from "react";
import axios from "axios";
import DarkModeToggle from "../components/DarkModeToggle";
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

  useEffect(() => {
    fetchAvailableQuizzes();
  }, []);

  const fetchAvailableQuizzes = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/student/quizzes?studentId=${studentId}&section=${studentSection}`
      );
      const currentTime = new Date().getTime();

      const availableQuizzes = response.data.filter((quiz) => {
        const startTime = new Date(quiz.startTime).getTime();
        const endTime = new Date(quiz.endTime).getTime();
        return currentTime >= startTime && currentTime <= endTime;
      });

      setQuizzes(availableQuizzes);
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
      <div className="container mx-auto p-4">
        <div className="header-top">
          <h1>Quiz Portal</h1>
          <DarkModeToggle />
        </div>
        <h2 className="text-2xl font-bold mb-4">Available Quizzes</h2>
        {quizzes.length === 0 ? (
          <p className="text-gray-500">No available quizzes at the moment.</p>
        ) : (
          <ul className="space-y-2">
            {quizzes.map((quiz) => (
              <li key={quiz._id} className="border p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">
                      Time: {new Date(quiz.startTime).toLocaleString()} -{" "}
                      {new Date(quiz.endTime).toLocaleString()}
                    </p>
                  </div>
                  <button
                    disabled={
                      quiz.isAttempted || quiz.registrationStatus !== "accepted"
                    }
                    className={`px-4 py-2 rounded ${
                      quiz.registrationStatus === "pending"
                        ? "bg-yellow-400 cursor-not-allowed"
                        : quiz.registrationStatus === "rejected" ||
                          quiz.registrationStatus === "not_registered"
                        ? "bg-gray-400 cursor-not-allowed"
                        : quiz.isAttempted
                        ? "bg-red-400 cursor-not-allowed"
                        : "bg-blue-500 text-white"
                    }`}
                    onClick={() => handleQuizSelect(quiz)}
                  >
                    {quiz.isAttempted
                      ? "Attempted"
                      : quiz.registrationStatus === "pending"
                      ? "Pending Approval"
                      : quiz.registrationStatus === "rejected"
                      ? "Rejected"
                      : quiz.registrationStatus === "not_registered"
                      ? "Not Registered"
                      : "Start Quiz"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {selectedQuiz && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-100">
            <h3 className="text-lg font-bold mb-2">Enter Quiz Password</h3>
            <input
              type="password"
              className="border p-2 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            <button
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
              onClick={handlePasswordSubmit}
            >
              Start Quiz
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </div>
    );
  }

  // ✅ Proper JSX return starts here
  return (
    <div style={{ display: "flex" }}>
      {/* Right Panel - Main Quiz Content */}
      <div style={{ flex: 1 }}>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {quiz && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <div className="header-top">
                <h2>{quiz.title}</h2>
                <DarkModeToggle />
              </div>

              <p
                style={{
                  fontWeight: "bold",
                  color: timeLeft <= 60000 ? "red" : "black",
                }}
              >
                ⏳ Time Left: {Math.floor(timeLeft / 60000)}m{" "}
                {Math.floor((timeLeft % 60000) / 1000)}s
              </p>
            </div>

            <div>
              <h4>{quiz.questions[currentIndex].questionText}</h4>
              {quiz.questions[currentIndex].options.map((option, optIndex) => (
                <label
                  key={optIndex}
                  style={{ display: "block", margin: "6px 0" }}
                >
                  <input
                    type="radio"
                    name={`q${currentIndex}`}
                    value={optIndex}
                    checked={answers[currentIndex] === optIndex}
                    onChange={() => handleAnswerChange(currentIndex, optIndex)}
                  />{" "}
                  {option}
                </label>
              ))}
            </div>
            <button
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
            </button>

            <div style={{ marginTop: "12px" }}>
              {currentIndex > 0 &&
                (!answers[currentIndex - 1] ||
                  markedForReview[currentIndex - 1]) && (
                  <button onClick={() => setCurrentIndex(currentIndex - 1)}>
                    Previous
                  </button>
                )}

              {currentIndex < quiz.questions.length - 1 ? (
                <button onClick={() => setCurrentIndex(currentIndex + 1)}>
                  Next
                </button>
              ) : (
                <button onClick={handleSubmit}>
                  {loading ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Left Panel - Sidebar */}
      <div style={{ width: "150px", marginRight: "16px" }}>
        {quiz?.questions?.length === 0 ? (
          <p>No questions available in this quiz.</p>
        ) : (
          quiz?.questions?.map((_, index) => {
            let bgColor = "#ffffff"; // default

            if (markedForReview[index] && index in answers) {
              bgColor = "#b19cd9"; // 💜 Purple for Answered + Marked for Review
            } else if (markedForReview[index]) {
              bgColor = "#ffb347"; // 🟧 Orange for Marked
            } else if (index in answers) {
              bgColor = "#90ee90"; // ✅ Green for Answered
            } else if (index === currentIndex) {
              bgColor = "#add8e6"; // 🟦 Light blue for current
            } else if (index < currentIndex) {
              bgColor = "#fdd835"; // 🟨 Yellow for visited but unanswered
            }

            return (
              <div
                key={index}
                onClick={() => {
                  const isUnanswered = !answers[index];
                  const isMarked = markedForReview[index];
                  if (index === currentIndex || isUnanswered || isMarked) {
                    setCurrentIndex(index);
                  }
                }}
                style={{
                  padding: "8px",
                  margin: "4px",
                  backgroundColor: bgColor,
                  borderRadius: "6px",
                  textAlign: "center",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Q{index + 1}
              </div>
            );
          })
        )}

        {/* Legend */}
        <div style={{ marginTop: "16px", fontSize: "14px" }}>
          <p>
            <span style={dotStyle("#90ee90")}></span> Answered
          </p>
          <p>
            <span style={dotStyle("#ffb347")}></span> Marked for Review
          </p>
          <p>
            <span style={dotStyle("#b19cd9")}></span> Answered + Marked
          </p>
          <p>
            <span style={dotStyle("#fdd835")}></span> Visited but Unanswered
          </p>
          <p>
            <span style={dotStyle("#add8e6")}></span> Current Question
          </p>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
