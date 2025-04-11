import { useEffect, useState, useRef } from "react";
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
    alert("Warning: Please don't switch tabs during the quiz!");

    if (tabSwitchCount === 2) {
      alert("Warning: Next tab switch will auto-submit your quiz.");
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

  // Fetch quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
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
          window.location.href = "/StudentQuiz";
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
              <h2>{quiz.title}</h2>
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
        {quiz?.questions?.map((_, index) => {
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
        })}

        {/* Legend */}
        <div style={{ marginTop: "16px", fontSize: "14px" }}>
          <p>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: "#90ee90",
                borderRadius: "4px",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            ></span>{" "}
            Answered
          </p>
          <p>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: "#add8e6",
                borderRadius: "4px",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            ></span>{" "}
            Currently Viewing
          </p>
          <p>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: "#fdd835",
                borderRadius: "4px",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            ></span>{" "}
            Viewed but Unanswered
          </p>
          <p>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: "#eee",
                borderRadius: "4px",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            ></span>{" "}
            Not Viewed
          </p>
          <p>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: "#ffb347",
                borderRadius: "4px",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            ></span>{" "}
            Marked for Review
          </p>
          <p>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: "#b19cd9",
                borderRadius: "4px",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            ></span>{" "}
            Marked for review and Answered
          </p>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
