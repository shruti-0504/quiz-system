import React from "react";
import { Link } from "react-router-dom";

const QuizCard = ({ quiz, onSelect }) => {
  const quizStatus = () => {
    if (quiz.isAttempted) {
      return "bg-red-400 cursor-not-allowed";
    }
    if (quiz.registrationStatus === "pending") {
      return "bg-yellow-400 cursor-not-allowed";
    }
    if (
      quiz.registrationStatus === "rejected" ||
      quiz.registrationStatus === "not_registered"
    ) {
      return "bg-gray-400 cursor-not-allowed";
    }
    return "bg-blue-500 text-white";
  };

  return (
    <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">{quiz.title}</h3>
          <p className="text-sm text-gray-500">
            Time: {new Date(quiz.startTime).toLocaleString()} -{" "}
            {new Date(quiz.endTime).toLocaleString()}
          </p>
        </div>
        <div>
          <span
            className={`px-4 py-2 rounded ${quizStatus()}`}
            onClick={() => onSelect(quiz)}
            disabled={
              quiz.isAttempted || quiz.registrationStatus !== "accepted"
            }
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
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuizCard;
