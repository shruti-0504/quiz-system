import React from "react";

const QuizCard = ({ quiz, onSelect }) => {
  const getAction = () => {
    if (quiz.isAttempted) {
      return (
        <button
          className="bg-gray-500 text-white py-1 px-4 rounded cursor-not-allowed"
          disabled
        >
          Attempted
        </button>
      );
    }
    if (quiz.registrationStatus === "pending") {
      return (
        <span className="text-orange-500 font-semibold">Pending Approval</span>
      );
    }
    if (quiz.registrationStatus === "rejected") {
      return <span className="text-red-500 font-semibold">Rejected</span>;
    }
    if (quiz.registrationStatus === "not_registered") {
      return (
        <span className="text-gray-500 font-semibold">Not Registered</span>
      );
    }
    return (
      <button
        className="bg-blue-600 text-white py-1 px-4 rounded hover:bg-blue-700 transition"
        onClick={() => onSelect(quiz)}
      >
        Start Quiz
      </button>
    );
  };

  return (
    <div className="bg-[#cbcbcb] text-black rounded-xl shadow-lg p-6 my-4 transition-transform hover:-translate-y-1">
      <h4 className="text-lg font-semibold mb-2">{quiz.title}</h4>
      <p className="text-sm">
        <strong>Start:</strong> {new Date(quiz.startTime).toLocaleString()}
      </p>
      <p className="text-sm mb-2">
        <strong>End:</strong> {new Date(quiz.endTime).toLocaleString()}
      </p>
      <div className="mt-3">{getAction()}</div>
    </div>
  );
};

export default QuizCard;
