import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/TeacherDashboard.css";

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState("assign-section");
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    questions: [],
    section: "",
  });

  // Fetch students with no section
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/teacher/students/no-section"
        );
        setStudents(response.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    if (activeTab === "assign-section") {
      fetchStudents();
    }
  }, [activeTab]);

  // Fetch quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        // Assuming teacherId is stored in localStorage or context
        const teacherId = localStorage.getItem("userId");
        const response = await axios.get(
          `http://localhost:5000/teacher/quizzes?teacherId=${teacherId}`
        );
        setQuizzes(response.data);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
    };

    if (activeTab === "quizzes" || activeTab === "results") {
      fetchQuizzes();
    }
  }, [activeTab]);

  // Fetch results for selected quiz
  useEffect(() => {
    const fetchResults = async () => {
      if (selectedQuiz) {
        try {
          const response = await axios.get(
            `http://localhost:5000/teacher/results/${selectedQuiz}`
          );
          setResults(response.data);
        } catch (error) {
          console.error("Error fetching results:", error);
        }
      }
    };

    if (activeTab === "results" && selectedQuiz) {
      fetchResults();
    }
  }, [activeTab, selectedQuiz]);

  const updateSection = async (id, section) => {
    try {
      await axios.put(`http://localhost:5000/teacher/update-section/${id}`, {
        section,
      });
      setStudents(students.filter((student) => student._id !== id));
      alert("Section updated successfully!");
    } catch (error) {
      console.error("Error updating section:", error);
      alert("Failed to update section");
    }
  };

  const createQuiz = async () => {
    try {
      const teacherId = localStorage.getItem("userId");
      const response = await axios.post(
        "http://localhost:5000/teacher/quiz/create",
        {
          ...newQuiz,
          createdBy: teacherId,
        }
      );
      setQuizzes([...quizzes, response.data]);
      setNewQuiz({ title: "", questions: [], section: "" });
      alert("Quiz created successfully!");
    } catch (error) {
      console.error("Error creating quiz:", error);
      alert("Failed to create quiz");
    }
  };

  const assignQuiz = async (quizId, studentIds) => {
    try {
      await axios.put(`http://localhost:5000/teacher/quiz/assign/${quizId}`, {
        studentIds,
      });
      alert("Quiz assigned successfully!");
    } catch (error) {
      console.error("Error assigning quiz:", error);
      alert("Failed to assign quiz");
    }
  };

  const releaseResults = async (quizId, release) => {
    try {
      await axios.put(
        `http://localhost:5000/teacher/results/release/${quizId}`,
        { release }
      );
      alert(`Results ${release ? "released" : "hidden"} successfully!`);
    } catch (error) {
      console.error("Error updating results release:", error);
      alert("Failed to update results visibility");
    }
  };

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <div className="navigation">
          <button onClick={() => setActiveTab("assign-section")}>
            Assign Sections
          </button>
          <button onClick={() => setActiveTab("quizzes")}>
            Manage Quizzes
          </button>
          <button onClick={() => setActiveTab("results")}>View Results</button>
        </div>
      </div>

      {activeTab === "assign-section" && (
        <div className="assign-section">
          <h2>Assign Sections to Students</h2>
          {students.length === 0 ? (
            <p>No students without sections found.</p>
          ) : (
            students.map((student) => (
              <div key={student._id} className="student-card">
                <h3>{student.email}</h3>
                <input
                  type="text"
                  placeholder="Section"
                  onChange={(e) => (student.section = e.target.value)}
                />
                <button
                  onClick={() => updateSection(student._id, student.section)}
                >
                  Update
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "quizzes" && (
        <div className="manage-quizzes">
          <h2>Manage Quizzes</h2>

          <div className="create-quiz">
            <h3>Create New Quiz</h3>
            <input
              type="text"
              placeholder="Quiz Title"
              value={newQuiz.title}
              onChange={(e) =>
                setNewQuiz({ ...newQuiz, title: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Section"
              value={newQuiz.section}
              onChange={(e) =>
                setNewQuiz({ ...newQuiz, section: e.target.value })
              }
            />
            {/* For simplicity, using textarea for questions - in real app you'd have a better UI */}
            <textarea
              placeholder="Enter questions (JSON format)"
              value={JSON.stringify(newQuiz.questions, null, 2)}
              onChange={(e) => {
                try {
                  setNewQuiz({
                    ...newQuiz,
                    questions: JSON.parse(e.target.value),
                  });
                } catch (err) {
                  console.error("Invalid JSON");
                }
              }}
            />
            <button onClick={createQuiz}>Create Quiz</button>
          </div>

          <div className="quiz-list">
            <h3>Your Quizzes</h3>
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="quiz-card">
                <h4>{quiz.title}</h4>
                <p>Section: {quiz.section}</p>
                <button
                  onClick={() => {
                    // In a real app, you'd have a proper student selection UI
                    const studentIds = students.map((s) => s._id);
                    assignQuiz(quiz._id, studentIds);
                  }}
                >
                  Assign to Students
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div className="view-results">
          <h2>View Quiz Results</h2>

          <div className="quiz-selection">
            <select
              value={selectedQuiz || ""}
              onChange={(e) => setSelectedQuiz(e.target.value)}
            >
              <option value="">Select a Quiz</option>
              {quizzes.map((quiz) => (
                <option key={quiz._id} value={quiz._id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </div>

          {selectedQuiz && (
            <div className="results-actions">
              <button onClick={() => releaseResults(selectedQuiz, true)}>
                Release Results to Students
              </button>
              <button onClick={() => releaseResults(selectedQuiz, false)}>
                Hide Results from Students
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result._id}>
                      <td>{result.studentId?.email}</td>
                      <td>
                        {result.score} / {result.totalQuestions}
                      </td>
                      <td>{new Date(result.submittedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
