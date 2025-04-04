import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Quiz = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuiz = async () => {
    if (!password.trim()) return alert("Please enter a quiz password!");

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/quiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: id, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setQuiz(data.quiz);
        setAnswers({});
      } else {
        setError(data.message || "Invalid password or quiz not found!");
      }
    } catch (err) {
      setError("Error fetching quiz! Please try again.");
    }
    setLoading(false);
  };

  const handleAnswerChange = (questionIndex, selectedOption) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: selectedOption }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== quiz.questions.length) {
      return alert("Please answer all questions before submitting!");
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: id, answers }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Quiz submitted successfully!");
        setQuiz(null); // Reset quiz state
        setAnswers({});
      } else {
        setError(data.message || "Error submitting quiz!");
      }
    } catch (err) {
      setError("Error submitting quiz! Please try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Quiz</h2>

      {!quiz ? (
        <div>
          <input
            type="password"
            placeholder="Enter Quiz Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={fetchQuiz} disabled={loading}>
            {loading ? "Loading..." : "Start Quiz"}
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      ) : (
        <div>
          <h3>{quiz.title}</h3>
          {quiz.questions.map((q, index) => (
            <div key={index}>
              <h4>{q.questionText}</h4>
              {q.options.map((option, optIndex) => (
                <label key={optIndex} style={{ display: "block" }}>
                  <input
                    type="radio"
                    name={`q${index}`}
                    value={optIndex}
                    checked={answers[index] === optIndex}
                    onChange={() => handleAnswerChange(index, optIndex)}
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={
              Object.keys(answers).length !== quiz.questions.length || loading
            }
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
