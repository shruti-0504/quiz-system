import React, { useState, useEffect } from "react";
import axios from "axios";

const StudentQuiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAvailableQuizzes();
  }, []);

  const fetchAvailableQuizzes = async () => {
    try {
      const response = await axios.get("/student/quizzes");
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
        `/api/student/verify-quiz/${selectedQuiz._id}`,
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

  return (
    <div className="container mx-auto p-4">
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
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={() => handleQuizSelect(quiz)}
                  disabled={quiz.isAttempted}
                >
                  {quiz.isAttempted ? "Attempted" : "Start Quiz"}
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
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
};

export default StudentQuiz;
