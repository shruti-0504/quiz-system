import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/TeacherDashboard.css";

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [selectedQuizSection, setSelectedQuizSection] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState("assign-section");
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    questions: [],
    section: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [quizApprovals, setQuizApprovals] = useState({});

  const sections = ["K22FG", "K23FG", "K22CS", "K23CS", "K22SE", "K23SE"];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch students with no section
        const studentsRes = await axios.get(
          "http://localhost:5000/teacher/students/no-section"
        );
        setStudents(
          studentsRes.data.map((student) => ({
            ...student,
            section: "",
          }))
        );
        const teacherId = localStorage.getItem("registrationNumber");

        // Fetch quizzes
        const quizzesRes = await axios.get(
          `http://localhost:5000/teacher/quizzes?teacherId=${teacherId}`
        );
        setQuizzes(quizzesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === "assign-section") {
      fetchData();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchPendingStudents = async () => {
      if (!quizTitle) {
        setPendingStudents([]); // Reset if nothing selected
        return;
      }

      setIsLoading(true);
      try {
        const teacherId = localStorage.getItem("registrationNumber");

        const pendingRes = await axios.get(
          `http://localhost:5000/teacher/students/pending?teacherId=${teacherId}&quizTitle=${quizTitle}`
        );

        setPendingStudents(pendingRes.data);
      } catch (error) {
        console.error("Error fetching pending students:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingStudents();
  }, [quizTitle]); // 🔁 Runs every time quizTitle changes

  // Fetch results for selected quiz
  useEffect(() => {
    const fetchResults = async () => {
      if (selectedQuiz) {
        try {
          setIsLoading(true);
          const response = await axios.get(
            `http://localhost:5000/teacher/results/${selectedQuiz}`
          );
          setResults(response.data);
        } catch (error) {
          console.error("Error fetching results:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (activeTab === "results" && selectedQuiz) {
      fetchResults();
    }
  }, [activeTab, selectedQuiz]);

  const updateSection = async (id, section) => {
    try {
      setIsLoading(true);
      await axios.put(`http://localhost:5000/teacher/update-section/${id}`, {
        section,
      });
      setStudents(students.filter((student) => student._id !== id));
      alert("Section updated successfully!");
    } catch (error) {
      console.error("Error updating section:", error);
      alert("Failed to update section");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (studentId, quizId, status) => {
    try {
      setIsLoading(true);
      await axios.put(`http://localhost:5000/teacher/approve-student?studentRegNo=${studentId}&quiztitle=${quizId}&status=${status}`);
      

      setPendingStudents(
        pendingStudents.filter((student) => student._id !== studentId)
      );
      alert(
        `Student ${
          status === "accepted" ? "accepted" : "rejected"
        } successfully!`
      );
    } catch (error) {
      console.error("Error updating approval status:", error);
      alert("Failed to update approval status");
    } finally {
      setIsLoading(false);
    }
  };

  const createQuiz = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const assignQuiz = async (quizId, studentIds) => {
    try {
      setIsLoading(true);
      await axios.put(`http://localhost:5000/teacher/quiz/assign/${quizId}`, {
        studentIds,
      });
      alert("Quiz assigned successfully!");
    } catch (error) {
      console.error("Error assigning quiz:", error);
      alert("Failed to assign quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const releaseResults = async (quizId, release) => {
    try {
      setIsLoading(true);
      await axios.put(
        `http://localhost:5000/teacher/results/release/${quizId}`,
        { release }
      );
      alert(`Results ${release ? "released" : "hidden"} successfully!`);
    } catch (error) {
      console.error("Error updating results release:", error);
      alert("Failed to update results visibility");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const selected = quizzes.find((quiz) => quiz.title === quizTitle);
    setSelectedQuiz(selected || null);
  }, [quizTitle, quizzes]);
  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <div className="navigation">
          <button
            onClick={() => setActiveTab("assign-section")}
            className={activeTab === "assign-section" ? "active" : ""}
          >
            Teacher Dashboard
          </button>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={activeTab === "quizzes" ? "active" : ""}
          >
            Manage Quizzes
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={activeTab === "results" ? "active" : ""}
          >
            View Results
          </button>
        </div>
      </div>

      {isLoading && <div className="loading">Loading...</div>}

      {activeTab === "assign-section" && (
        <div className="assign-section">
          {/* Section Assignment */}
          <div className="section-assignment">
            <h2>Assign Sections to Students</h2>
            {students.length === 0 && !isLoading ? (
              <p>No students without sections found.</p>
            ) : (
              students.map((student) => (
                <div key={student._id} className="student-card">
                  <h3>{student.email}</h3>
                  <select
                    value={student.section}
                    onChange={(e) => {
                      const updatedStudents = students.map((s) =>
                        s._id === student._id
                          ? { ...s, section: e.target.value }
                          : s
                      );
                      setStudents(updatedStudents);
                    }}
                  >
                    <option value="">Select Section</option>
                    {sections.map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => updateSection(student._id, student.section)}
                    disabled={!student.section}
                  >
                    Update
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Student Approvals */}
          <div className="student-approvals">
            <h2>Student Approvals</h2>

            <div className="quiz-selection-container">
              <label htmlFor="quizTitle">Select Quiz: </label>
              <select
                id="quizTitle"
                value={quizTitle}
                onChange={(e) => {
                  setQuizTitle(e.target.value);
                }}
                // setSelectedQuizSection(selected?.section || "");

                className="quiz-dropdown"
              >
                <option value="">-- Select Quiz --</option>
                {quizzes.map((quiz) => (
                  <option key={quiz._id} value={quiz.title}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <p>Loading...</p>
            ) : pendingStudents.length === 0 ? (
              <p>No pending student approvals.</p>
            ) : (
              <div className="table-responsive">
                <table className="approvals-table">
                  <thead>
                    <tr>
                      <th>Reg No</th>
                      <th>Name</th>
                      <th>Section</th>
                      <th>Course</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStudents
                      .filter((student) => {
                        return selectedQuiz
                          ? student.studentDetails?.section ===
                              selectedQuiz.section
                          : false;
                      })

                      .map((student) => (
                        <tr key={student._id}>
                          <td>{student.studentRegNo || "Unknown"}</td>
                          <td>{student.studentDetails?.name || "Unknown"}</td>

                          <td>
                            {student.studentDetails?.section || "Not assigned"}
                          </td>
                          <td>{selectedQuiz?.course || "Unknown"}</td>
                          <td className="approval-actions">
                            <button
                              onClick={() =>
                                handleApproval(
                                  student._id,
                                  quizTitle,
                                  "accepted"
                                )
                              }
                              disabled={!quizTitle}
                              className="approve-btn"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleApproval(
                                  student._id,
                                  quizTitle,
                                  "rejected"
                                )
                              }
                              className="reject-btn"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
