import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import "../styles/TeacherDashboard.css";

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState("assign-section");
  const { id } = useParams();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAllotForm, setShowAllotForm] = useState(false);
  const [allotSection, setAllotSection] = useState("");
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    courseCode: "",
    duration: "",
    password: "",
    startTime: "",
    endTime: "",
    questions: [{ question: "", options: ["", "", "", ""], correctOption: 0 }],
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
    } catch (error) {
      console.error("Error updating section:", error);
      alert("Failed to update section");
    }
  };
  // const assignQuiz = async (quizId, studentIds) => {
  //   try {
  //     await axios.put(http://localhost:5000/teacher/quiz/assign/${quizId}, {
  //       studentIds,
  //     });
  //     alert("Quiz assigned successfully!");
  //   } catch (error) {
  //     console.error("Error assigning quiz:", error);
  //     alert("Failed to assign quiz");
  //   }
  // };
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

  const validateDuration = (duration, startTime, endTime) => {
    let value = parseInt(duration, 10);
    const start = new Date(startTime);
    const end = new Date(endTime);
    const maxDuration = (end - start) / (1000 * 60);
    return value < 0
      ? 0
      : maxDuration > 0 && value > maxDuration
      ? maxDuration
      : value;
  };

  const validateQuiz = () => {
    for (let q of newQuiz.questions) {
      if (!q.question.trim()) return "All questions must be filled!";
      if (q.options.some((opt) => !opt.trim()))
        return "All options must be filled!";
    }
    return null;
  };

  const handleCreateQuiz = async () => {
    const error = validateQuiz();
    if (error) {
      alert(error);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/teacher/quiz/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuiz),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Quiz created successfully!");
        setNewQuiz({
          title: "",
          courseCode: "",
          duration: "",
          password: "",
          startTime: "",
          endTime: "",
          questions: [
            { question: "", options: ["", "", "", ""], correctOption: 0 },
          ],
        });
        setShowCreateForm(false);
      } else {
        alert(data.message || "Error creating quiz.");
      }
    } catch (err) {
      alert("Error creating quiz!");
    }
  };

  const handleAllotQuiz = async () => {
    try {
      const res = await fetch("http://localhost:5000/quiz/allot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: id, allotSection }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Quiz allotted to section!");
        setAllotSection("");
        setShowAllotForm(false);
      } else {
        alert(data.message || "Error allotting quiz.");
      }
    } catch (err) {
      alert("Error allotting quiz!");
    }
  };

  const updateQuestionText = (index, text) => {
    const updated = [...newQuiz.questions];
    updated[index].question = text;
    setNewQuiz({ ...newQuiz, questions: updated });
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...newQuiz.questions];
    updated[qIndex].options[optIndex] = value;
    setNewQuiz({ ...newQuiz, questions: updated });
  };

  const updateCorrectOption = (qIndex, value) => {
    const updated = [...newQuiz.questions];
    updated[qIndex].correctOption = parseInt(value, 10);
    setNewQuiz({ ...newQuiz, questions: updated });
  };

  const addQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [
        ...newQuiz.questions,
        { question: "", options: ["", "", "", ""], correctOption: 0 },
      ],
    });
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
          <div className="create-quiz">
            <div className="teacher-quiz-container">
              <div className="button-group spaced">
                <button onClick={() => setShowCreateForm(!showCreateForm)}>
                  Create Quiz
                </button>
                <button onClick={() => setShowAllotForm(!showAllotForm)}>
                  Allot Quiz
                </button>
              </div>

              {showCreateForm && (
                <div className="create-quiz-form">
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
                    placeholder="Course Code"
                    value={newQuiz.courseCode}
                    onChange={(e) =>
                      setNewQuiz({ ...newQuiz, courseCode: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Quiz Password"
                    value={newQuiz.password}
                    onChange={(e) =>
                      setNewQuiz({ ...newQuiz, password: e.target.value })
                    }
                  />
                  <input
                    type="datetime-local"
                    placeholder="Start Time"
                    value={newQuiz.startTime}
                    onChange={(e) =>
                      setNewQuiz({ ...newQuiz, startTime: e.target.value })
                    }
                  />
                  <input
                    type="datetime-local"
                    placeholder="End Time"
                    value={newQuiz.endTime}
                    onChange={(e) =>
                      setNewQuiz({ ...newQuiz, endTime: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Duration (in minutes)"
                    value={newQuiz.duration}
                    onChange={(e) =>
                      setNewQuiz({
                        ...newQuiz,
                        duration: validateDuration(
                          e.target.value,
                          newQuiz.startTime,
                          newQuiz.endTime
                        ),
                      })
                    }
                  />

                  {newQuiz.questions.map((q, qIndex) => (
                    <div className="question-card" key={qIndex}>
                      <input
                        type="text"
                        placeholder={`Question ${qIndex + 1}`}
                        value={q.question}
                        onChange={(e) =>
                          updateQuestionText(qIndex, e.target.value)
                        }
                      />
                      {q.options.map((opt, optIndex) => (
                        <input
                          key={optIndex}
                          type="text"
                          placeholder={`Option ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) =>
                            updateOption(qIndex, optIndex, e.target.value)
                          }
                        />
                      ))}
                      <label>Correct Option:</label>
                      <select
                        value={q.correctOption}
                        onChange={(e) =>
                          updateCorrectOption(qIndex, e.target.value)
                        }
                      >
                        {q.options.map((_, optIndex) => (
                          <option key={optIndex} value={optIndex}>{`Option ${
                            optIndex + 1
                          }`}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button className="spaced-button" onClick={addQuestion}>
                    Add Question
                  </button>
                  <button className="spaced-button" onClick={handleCreateQuiz}>
                    Submit Quiz
                  </button>
                </div>
              )}

              {showAllotForm && (
                <div className="allot-quiz-form">
                  <h3>Allot Quiz to Section</h3>
                  <input
                    type="text"
                    placeholder="Section"
                    value={allotSection}
                    onChange={(e) => setAllotSection(e.target.value)}
                  />
                  <button onClick={handleAllotQuiz}>Allot Quiz</button>
                </div>
              )}
            </div>
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
                    // assignQuiz(quiz._id, studentIds);
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
