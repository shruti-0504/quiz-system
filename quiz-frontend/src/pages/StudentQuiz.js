import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const StudentQuiz = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [password, setPassword] = useState("");

  const fetchQuiz = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/student/verify-quiz/:quizId",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: id, password }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setQuiz(data.quiz);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Error fetching quiz!");
    }
  };

  const handleSubmit = async () => {
    try {
      await fetch("http://localhost:5000/student/submit-quiz/:quizId", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: id, answers }),
      });
      alert("Quiz submitted successfully!");
    } catch (err) {
      alert("Error submitting quiz!");
    }
  };

  return (
    <div>
      <h2>StudentQuiz</h2>
      <input
        type="password"
        placeholder="Enter Quiz Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={fetchQuiz}>Start Quiz</button>
      {quiz &&
        quiz.questions.map((q, index) => (
          <div key={index}>
            <h4>{q.question}</h4>
            {q.options.map((option, optIndex) => (
              <div key={optIndex}>
                <input
                  type="radio"
                  name={"q${index}"}
                  value={optIndex}
                  onChange={() => setAnswers({ ...answers, [index]: optIndex })}
                />
                {option}
              </div>
            ))}
          </div>
        ))}
      {quiz && <button onClick={handleSubmit}>Submit</button>}
    </div>
  );
};

export default StudentQuiz;
