import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/TeacherDashboard.css";
import "../styles/TeacherQuiz.css";
import DarkModeToggle from "../components/DarkModeToggle";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@mui/material/styles";
const TeacherDashboard = () => {
  const API_BASE = process.env.REACT_APP_API_URL;
  const [students, setStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState("assign-section");
  const [isLoading, setIsLoading] = useState(false);
  const teacherId = localStorage.getItem("registrationNumber");
  const [error, setError] = useState(null);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    course: "",
    section: "",
    teacherRegNo: teacherId,
    password: "",
    RegStartTime: "",
    RegEndTime: "",
    startTime: "",
    endTime: "",
    duration: "",
    questions: [
      {
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ],
  });
  const [editQuiz, setEditQuiz] = useState(null);
  const sections = ["K22FG", "K23FG", "K22CS", "K23CS"];
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch students with no section
        const studentsRes = await axios.get(
          `${API_BASE}/teacher/students/no-section`
        );
        setStudents(
          studentsRes.data.map((student) => ({
            ...student,
            section: "",
          }))
        );

        // Fetch quizzes
        const quizzes = await axios.get(
          `${API_BASE}/teacher/quizzes?teacherId=${teacherId}`
        );
        setQuizzes(quizzes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const fetchAllStudents = async () => {
    if (!quizTitle) {
      setPendingStudents([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/teacher/students/all?teacherId=${teacherId}&quizTitle=${quizTitle}`
      );

      setPendingStudents(res.data);
    } catch (error) {
      console.error("Error fetching all students:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchAllStudents();
  }, [quizTitle]);

  // Fetch results for selected quiz
  useEffect(() => {
    const fetchResults = async () => {
      if (selectedQuiz) {
        try {
          setIsLoading(true);
          const response = await axios.get(
            `${API_BASE}/teacher/results/${selectedQuiz}`
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
      await axios.put(`${API_BASE}/teacher/update-section/${id}`, {
        section,
      });
      setStudents(students.filter((student) => student._id !== id));
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

      await axios.put(
        `${API_BASE}/teacher/approve-student?studentRegNo=${studentId}&quizTitle=${quizId}&status=${status}`
      );

      // ⬅️ Refetch the updated list
      fetchAllStudents();
    } catch (error) {
      console.error("Error updating approval status:", error);
      alert("Failed to update approval status");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const selected = quizzes.find((quiz) => quiz.title === quizTitle);
    setSelectedQuiz(selected || null);
  }, [quizTitle, quizzes]);

  // Fetch quiz details when selected
  useEffect(() => {
    const fetchQuizDetails = async () => {
      if (!selectedQuiz) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/teacher/quiz/${selectedQuiz}`);

        // Check if the response status is OK
        if (!res.ok) {
          const message = `HTTP error! status: ${res.status}`;
          console.error(message);
          setError(message); // Set error state
          return; // Don't proceed if response is not ok
        }

        // Parse the response data
        const data = await res.json();

        // Set the quiz details into state (after formatting dates)
        setEditQuiz({
          ...data,
          startTime: formatDateTimeForInput(data.startTime),
          endTime: formatDateTimeForInput(data.endTime),
          RegStartTime: formatDateTimeForInput(data.RegStartTime),
          RegEndTime: formatDateTimeForInput(data.RegEndTime),
        });
      } catch (err) {
        console.error("Failed to fetch quiz details:", err);
        setError("Failed to load quiz details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizDetails();
  }, [selectedQuiz]);

  // Helper functions
  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const validateDuration = (duration, startTime, endTime) => {
    const value = parseInt(duration, 10);
    const start = new Date(startTime);
    const end = new Date(endTime);
    const maxDuration = (end - start) / (1000 * 60);

    if (value < 0) return 0;
    if (maxDuration > 0 && value > maxDuration) return maxDuration;
    return value;
  };

  const validateQuiz = (quiz) => {
    const requiredFields = [
      { field: "title", message: "Quiz title is required!" },
      { field: "course", message: "Course code is required!" },
      { field: "section", message: "Section is required!" },
      {
        field: "teacherRegNo",
        message: "Teacher registration number is required!",
      },
      { field: "password", message: "Password is required!" },
      { field: "duration", message: "Duration is required!" },
    ];

    for (const { field, message } of requiredFields) {
      if (!quiz[field]?.toString().trim()) return message;
    }

    if (!quiz.RegStartTime || !quiz.RegEndTime) {
      return "Registration start and end times are required!";
    }

    if (new Date(quiz.RegStartTime) >= new Date(quiz.RegEndTime)) {
      return "Registration end time must be after registration start time!";
    }

    if (!quiz.startTime || !quiz.endTime) {
      return "Start and end times are required!";
    }

    if (new Date(quiz.startTime) >= new Date(quiz.endTime)) {
      return "End time must be after quiz start time!";
    }

    if (new Date(quiz.RegEndTime) >= new Date(quiz.startTime)) {
      return "Quiz must start after registration ends!";
    }

    for (let q of quiz.questions) {
      if (!q.questionText.trim()) return "All questions must be filled!";
      if (q.options.some((opt) => !opt.trim()))
        return "All options must be filled!";
    }

    return null;
  };
  const handleCreateQuiz = async () => {
    const error = validateQuiz(newQuiz);
    if (error) {
      alert(error);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("${API_BASE}/teacher/quiz/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newQuiz,
          RegStartTime: new Date(newQuiz.RegStartTime).toISOString(),
          RegEndTime: new Date(newQuiz.RegEndTime).toISOString(),
          startTime: new Date(newQuiz.startTime).toISOString(),
          endTime: new Date(newQuiz.endTime).toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Quiz created successfully!");
        setNewQuiz({
          title: "",
          course: "",
          section: "",
          teacherRegNo: teacherId,
          password: "",
          RegStartTime: "",
          RegEndTime: "",
          startTime: "",
          endTime: "",
          duration: "",
          questions: [
            { questionText: "", options: ["", "", "", ""], correctAnswer: 0 },
          ],
        });
      } else {
        alert(data.message || "Error creating quiz.");
      }
    } catch (err) {
      console.error("Quiz creation error:", err);
      alert("Error creating quiz! Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleUpdateQuiz = async () => {
    const validationError = validateQuiz(editQuiz);
    if (validationError) {
      setError(validationError);
      return;
    }
    const convertToISO = (dateVal, fallback = new Date()) => {
      const date = new Date(dateVal || fallback);
      return isNaN(date.getTime()) ? null : date.toISOString();
    };

    const bodyToSend = {
      ...editQuiz,
      duration: parseInt(editQuiz.duration) || 0,
      RegStartTime: convertToISO(editQuiz.RegStartTime),
      RegEndTime: convertToISO(editQuiz.RegEndTime),
      startTime: convertToISO(editQuiz.startTime),
      endTime: convertToISO(editQuiz.endTime),
    };

    if (
      !bodyToSend.RegStartTime ||
      !bodyToSend.RegEndTime ||
      !bodyToSend.startTime ||
      !bodyToSend.endTime
    ) {
      setError("Please make sure all time fields are valid.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/teacher/quiz/update/${selectedQuiz}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyToSend),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      alert("Quiz updated successfully!");
    } catch (err) {
      console.error("Quiz update error:", err);
      setError("Failed to update quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setNewQuiz({
      title: "",
      course: "",
      section: "",
      teacherRegNo: teacherId,
      password: "",
      RegStartTime: "",
      RegEndTime: "",
      startTime: "",
      endTime: "",
      duration: "",
      questions: [
        { questionText: "", options: ["", "", "", ""], correctAnswer: 0 },
      ],
    });
  };

  // Question handlers (create form)
  const updateQuestionText = (index, text) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[index].questionText = text;
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[qIndex].options[optIndex] = value;
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const updateCorrectOption = (qIndex, value) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[qIndex].correctAnswer = parseInt(value, 10) || 0;
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };
  const addQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [
        ...newQuiz.questions,
        { questionText: "", options: ["", "", "", ""], correctAnswer: 0 },
      ],
    });
  };

  const removeQuestion = (index) => {
    if (newQuiz.questions.length <= 1) {
      alert("A quiz must have at least one question!");
      return;
    }

    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions.splice(index, 1);
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };
  // Question handlers (edit form)
  const updateEditQuestionText = (index, text) => {
    setEditQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, questionText: text } : q
      ),
    }));
  };

  const updateEditOption = (qIndex, optIndex, value) => {
    setEditQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((opt, j) =>
                j === optIndex ? value : opt
              ),
            }
          : q
      ),
    }));
  };

  const updateEditCorrectOption = (qIndex, value) => {
    setEditQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex ? { ...q, correctAnswer: parseInt(value, 10) || 0 } : q
      ),
    }));
  };

  const addEditQuestion = () => {
    setEditQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { questionText: "", options: ["", "", "", ""], correctAnswer: 0 },
      ],
    }));
  };

  const removeEditQuestion = (index) => {
    if (editQuiz.questions.length <= 1) {
      alert("A quiz must have at least one question!");
      return;
    }
    setEditQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };
  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>Teacher Dashboard</h1>
          <DarkModeToggle />
        </div>

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
            Create Quiz
          </button>
          <button
            onClick={() => setActiveTab("editQuizzes")}
            className={activeTab === "editQuizzes" ? "active" : ""}
          >
            Edit Quizzes
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
                <Box key={student._id} className="student-card">
                  <Typography variant="h6" gutterBottom>
                    {student.name}
                  </Typography>

                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Select Section</InputLabel>
                    <Select
                      label="Select Section"
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
                      <MenuItem value="">Select Section</MenuItem>
                      {sections.map((section) => (
                        <MenuItem key={section} value={section}>
                          {section}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => updateSection(student._id, student.section)}
                    disabled={!student.section}
                  >
                    Update
                  </Button>
                </Box>
              ))
            )}
          </div>

          {/* Student Approvals */}
          <div className="student-approvals">
            <h2>Registered Students</h2>

            <div className="quiz-selection-container">
              <FormControl fullWidth>
                <InputLabel>Select Quiz</InputLabel>
                <Select
                  value={quizTitle}
                  size="small"
                  label="Select Quiz"
                  onChange={(e) => setQuizTitle(e.target.value)}
                  disabled={isLoading}
                >
                  <MenuItem value="">
                    {isLoading
                      ? "Loading quizzes..."
                      : quizzes.length === 0
                      ? "No quizzes found"
                      : "Select a quiz"}
                  </MenuItem>
                  {quizzes.map((quiz) => (
                    <MenuItem key={quiz._id} value={quiz.title}>
                      {quiz.title} ({quiz.course} - {quiz.section})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {isLoading ? (
              <p>Loading...</p>
            ) : pendingStudents.length === 0 ? (
              <p>No Registered Students.</p>
            ) : (
              <div className="table-responsive">
                <table className="approvals-table">
                  <thead>
                    <tr>
                      <th>Reg No</th>
                      <th>Name</th>
                      <th>Section</th>
                      <th>Course</th>
                      <th>Registration Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStudents.map((student) => (
                      <tr key={student._id}>
                        <td>{student.studentRegNo || "Unknown"}</td>
                        <td>{student.studentDetails?.name || "Unknown"}</td>

                        <td>
                          {student.studentDetails?.section || "Not assigned"}
                        </td>
                        <td>{selectedQuiz?.course || "Unknown"}</td>
                        <td
                          className="approval-actions"
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {student.approvedByTeacher === "pending" ? (
                            <>
                              <button
                                onClick={() =>
                                  handleApproval(
                                    student.studentRegNo,
                                    quizTitle,
                                    "accepted"
                                  )
                                }
                                disabled={!quizTitle}
                                className="approve-btn"
                                style={{ marginRight: "10px" }} // Add some spacing between buttons
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleApproval(
                                    student.studentRegNo,
                                    quizTitle,
                                    "rejected"
                                  )
                                }
                                className="reject-btn"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span
                              style={{
                                fontWeight: "bold",
                                alignContent: "center",
                                color:
                                  student.approvedByTeacher === "accepted"
                                    ? isDarkMode
                                      ? "#90ee90"
                                      : "green"
                                    : isDarkMode
                                    ? "#ff7f7f"
                                    : "red",
                              }}
                            >
                              {student.approvedByTeacher
                                .charAt(0)
                                .toUpperCase() +
                                student.approvedByTeacher.slice(1)}
                            </span>
                          )}
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
        <div className="create-quiz-form">
          <Box
            className="create-quiz-form"
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Typography variant="h5">Create New Quiz</Typography>

            <TextField
              size="small"
              label="Quiz Title"
              value={newQuiz.title}
              onChange={(e) =>
                setNewQuiz({ ...newQuiz, title: e.target.value })
              }
            />

            <TextField
              size="small"
              label="Course Code"
              value={newQuiz.course}
              onChange={(e) =>
                setNewQuiz({ ...newQuiz, course: e.target.value })
              }
            />

            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                size="small"
                value={newQuiz.section}
                label="Section"
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, section: e.target.value })
                }
              >
                {sections.map((sec) => (
                  <MenuItem key={sec} value={sec}>
                    {sec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Teacher Reg No"
              value={newQuiz.teacherRegNo}
              disabled
            />

            <TextField
              size="small"
              label="Quiz Password"
              value={newQuiz.password}
              onChange={(e) =>
                setNewQuiz({ ...newQuiz, password: e.target.value })
              }
            />

            <Typography variant="body1">
              {" "}
              ⏰ Quiz Registration Period
            </Typography>

            <input
              type="datetime-local"
              value={newQuiz.RegStartTime}
              onChange={(e) =>
                setNewQuiz({ ...newQuiz, RegStartTime: e.target.value })
              }
            />

            <input
              type="datetime-local"
              value={newQuiz.RegEndTime}
              onChange={(e) =>
                setNewQuiz({ ...newQuiz, RegEndTime: e.target.value })
              }
            />

            <Typography variant="body1">🕐 Quiz Schedule</Typography>

            <input
              type="datetime-local"
              value={newQuiz.startTime}
              onChange={(e) =>
                setNewQuiz({
                  ...newQuiz,
                  startTime: e.target.value,
                  duration: validateDuration(
                    newQuiz.duration,
                    e.target.value,
                    newQuiz.endTime
                  ),
                })
              }
            />

            <input
              type="datetime-local"
              value={newQuiz.endTime}
              onChange={(e) =>
                setNewQuiz({
                  ...newQuiz,
                  endTime: e.target.value,
                  duration: validateDuration(
                    newQuiz.duration,
                    newQuiz.startTime,
                    e.target.value
                  ),
                })
              }
            />

            <TextField
              size="small"
              label="Quiz Duration (in minutes)"
              type="number"
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
              <Box
                key={qIndex}
                className="question-card"
                sx={{ p: 2, border: "1px solid #ccc", borderRadius: 2 }}
              >
                <Stack spacing={2.5}>
                  <TextField
                    size="small"
                    fullWidth
                    label={`Question ${qIndex + 1}`}
                    value={q.questionText}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  {q.options.map((opt, optIndex) => (
                    <TextField
                      size="small"
                      key={optIndex}
                      label={`Option ${optIndex + 1}`}
                      fullWidth
                      value={opt}
                      onChange={(e) =>
                        updateOption(qIndex, optIndex, e.target.value)
                      }
                      sx={{ mb: 1 }}
                    />
                  ))}

                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel>Correct Option</InputLabel>
                    <Select
                      value={q.correctAnswer}
                      label="Correct Option"
                      size="small"
                      onChange={(e) =>
                        updateCorrectOption(qIndex, e.target.value)
                      }
                    >
                      {q.options.map((_, optIndex) => (
                        <MenuItem key={optIndex} value={optIndex}>
                          Option {optIndex + 1}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                <Button
                  startIcon={<DeleteIcon />}
                  color="error"
                  variant="contained"
                  onClick={() => removeQuestion(qIndex)}
                  sx={{
                    mt: 1,
                    "&:hover": {
                      backgroundColor: isDarkMode ? "#ff6666" : "#ff4d4d", // dark/light hover red
                      color: "#fff", // optional: white text on hover
                    },
                  }}
                >
                  Remove Question
                </Button>
              </Box>
            ))}

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={addQuestion}
                sx={(theme) => ({
                  color: "#fff", // white text
                  backgroundColor: "#4253c0", // your custom blue
                })}
              >
                Add Question
              </Button>

              <Button
                variant="contained"
                onClick={handleCreateQuiz}
                sx={(theme) => ({
                  color: "#fff", // white text
                  backgroundColor: "#4253c0", // your custom blue
                })}
              >
                Submit Quiz
              </Button>
              <Button
                variant="contained"
                onClick={resetCreateForm}
                sx={(theme) => ({
                  color: "#fff", // white text
                  backgroundColor: "#4253c0", // your custom blue
                })}
              >
                Reset Quiz
              </Button>
            </Box>
          </Box>
        </div>
      )}
      {activeTab === "editQuizzes" && (
        <div className="create-quiz-form">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h5">Edit Quiz</Typography>

            <TextField
              size="small"
              label="Teacher Registration No"
              value={newQuiz.teacherRegNo}
              disabled
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Select Quiz</InputLabel>
              <Select
                value={selectedQuiz}
                size="small"
                label="Select Quiz"
                onChange={(e) => setSelectedQuiz(e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="">
                  {isLoading
                    ? "Loading quizzes..."
                    : quizzes.length === 0
                    ? "No quizzes found"
                    : "Select a quiz"}
                </MenuItem>
                {quizzes.map((quiz) => (
                  <MenuItem key={quiz._id} value={quiz._id}>
                    {quiz.title} ({quiz.course} - {quiz.section})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {editQuiz && (
              <>
                <TextField
                  size="small"
                  label="Quiz Title"
                  value={editQuiz.title}
                  disabled
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <Select
                    size="small"
                    value={editQuiz.section}
                    label="Section"
                    onChange={(e) =>
                      setEditQuiz({ ...editQuiz, section: e.target.value })
                    }
                  >
                    <MenuItem value="">Select Section</MenuItem>
                    {sections.map((sec) => (
                      <MenuItem key={sec} value={sec}>
                        {sec}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="body1">⏰ Registration Period</Typography>
                <input
                  type="datetime-local"
                  value={editQuiz.RegStartTime}
                  onChange={(e) =>
                    setEditQuiz({ ...editQuiz, RegStartTime: e.target.value })
                  }
                />
                <input
                  type="datetime-local"
                  value={editQuiz.RegEndTime}
                  onChange={(e) =>
                    setEditQuiz({ ...editQuiz, RegEndTime: e.target.value })
                  }
                />

                <Typography variant="body1"> 🕐 Quiz Schedule</Typography>
                <input
                  type="datetime-local"
                  value={editQuiz.startTime}
                  onChange={(e) =>
                    setEditQuiz({
                      ...editQuiz,
                      startTime: e.target.value,
                      duration: validateDuration(
                        editQuiz.duration,
                        e.target.value,
                        editQuiz.endTime
                      ),
                    })
                  }
                />
                <input
                  type="datetime-local"
                  value={editQuiz.endTime}
                  onChange={(e) =>
                    setEditQuiz({
                      ...editQuiz,
                      endTime: e.target.value,
                      duration: validateDuration(
                        editQuiz.duration,
                        editQuiz.startTime,
                        e.target.value
                      ),
                    })
                  }
                />
                <TextField
                  size="small"
                  label="Duration (minutes)"
                  type="number"
                  value={isNaN(editQuiz.duration) ? "" : editQuiz.duration}
                  onChange={(e) =>
                    setEditQuiz({
                      ...editQuiz,
                      duration: validateDuration(
                        e.target.value,
                        editQuiz.startTime,
                        editQuiz.endTime
                      ),
                    })
                  }
                  fullWidth
                />

                <Box>
                  <Typography variant="h6">Questions</Typography>
                  {editQuiz.questions.map((q, qIndex) => (
                    <Box
                      key={qIndex}
                      className="question-card"
                      sx={{ p: 2, border: "1px solid #ccc", borderRadius: 2 }}
                    >
                      <Stack spacing={2.5}>
                        <TextField
                          size="small"
                          label={`Question ${qIndex + 1}`}
                          fullWidth
                          value={q.questionText}
                          onChange={(e) =>
                            updateEditQuestionText(qIndex, e.target.value)
                          }
                          sx={{ mb: 2 }}
                        />

                        {q.options.map((opt, optIndex) => (
                          <TextField
                            size="small"
                            key={optIndex}
                            label={`Option ${optIndex + 1}`}
                            fullWidth
                            value={opt}
                            onChange={(e) =>
                              updateEditOption(qIndex, optIndex, e.target.value)
                            }
                            sx={{ mb: 1 }}
                          />
                        ))}

                        <FormControl fullWidth sx={{ mt: 1 }}>
                          <InputLabel>Correct Option</InputLabel>
                          <Select
                            value={q.correctAnswer}
                            label="Correct Option"
                            size="small"
                            onChange={(e) =>
                              updateEditCorrectOption(qIndex, e.target.value)
                            }
                          >
                            {q.options.map((_, optIndex) => (
                              <MenuItem key={optIndex} value={optIndex}>
                                Option {optIndex + 1}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        sx={{
                          mt: 1,
                          "&:hover": {
                            backgroundColor: isDarkMode ? "#c32f2f" : "#ff4d4d", // dark/light hover red
                            color: "#fff", // optional: white text on hover
                          },
                        }}
                        onClick={() => removeEditQuestion(qIndex)}
                      >
                        Remove Question
                      </Button>
                    </Box>
                  ))}
                  <Button
                    variant="contained"
                    onClick={addEditQuestion}
                    sx={(theme) => ({
                      color: "#fff", // white text
                      backgroundColor: "#4253c0", // your custom blue
                    })}
                  >
                    Add Question
                  </Button>
                </Box>

                <center>
                  <Button
                    variant="contained"
                    onClick={handleUpdateQuiz}
                    sx={(theme) => ({
                      color: "#fff", // white text
                      backgroundColor: "#4253c0", // your custom blue
                    })}
                  >
                    {isLoading ? "Updating..." : "Update Quiz"}
                  </Button>
                </center>
              </>
            )}
          </Box>
        </div>
      )}
      {activeTab === "results" && (
        <div className="view-results">
          <h2>View Quiz Results</h2>

          <FormControl fullWidth sx={{ marginBottom: 2 }}>
            <InputLabel>Select Quiz</InputLabel>
            <Select
              value={selectedQuiz}
              size="small"
              label="Select Quiz"
              onChange={(e) => setSelectedQuiz(e.target.value)}
              disabled={isLoading}
            >
              <MenuItem value="">
                {isLoading
                  ? "Loading quizzes..."
                  : quizzes.length === 0
                  ? "No quizzes found"
                  : "Select a quiz"}
              </MenuItem>
              {quizzes.map((quiz) => (
                <MenuItem key={quiz.title} value={quiz.title}>
                  {quiz.title} ({quiz.course} - {quiz.section})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {results.length === 0 ? (
            <p>No submitted Attempts.</p>
          ) : (
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Registration No.</th>
                    <th>Score</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result._id}>
                      <td>{result.studentDetails?.name || "Unknown"}</td>
                      <td>{result.studentRegNo}</td>
                      <td>
                        {result.score} / {result.answers.length}
                      </td>
                      <td>
                        {result.createdAt
                          ? new Date(result.createdAt).toLocaleString()
                          : "N/A"}
                      </td>
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
