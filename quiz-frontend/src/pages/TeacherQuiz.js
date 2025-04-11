import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/TeacherQuiz.css";

const sections = ["K22FG", "K23FG", "K22CS", "K23CS", "K22SE", "K23SE"];

const TeacherQuiz = () => {
  const { id } = useParams();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState(false);
  const [teacherQuizzes, setTeacherQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [error, setError] = useState(null);

  const [newQuiz, setNewQuiz] = useState({
    title: "",
    course: "",
    section: "",
    teacherRegNo: "",
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
  useEffect(() => {
    const fetchTeacherQuizzes = async () => {
      if (!newQuiz.teacherRegNo) {
        setTeacherQuizzes([]);
        return;
      }

      setIsFetchingQuizzes(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:5000/teacher/quizzes?teacherId=${newQuiz.teacherRegNo}`
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setTeacherQuizzes(data);

        // Auto-select if only one quiz exists
        if (data.length === 1) {
          setSelectedQuizId(data[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch quizzes:", err);
        setError("Failed to load quizzes. Please try again.");
        setTeacherQuizzes([]);
      } finally {
        setIsFetchingQuizzes(false);
      }
    };

    fetchTeacherQuizzes();
  }, [newQuiz.teacherRegNo]);

  // Fetch quiz details when selected
  useEffect(() => {
    const fetchQuizDetails = async () => {
      if (!selectedQuizId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:5000/teacher/quiz/${selectedQuizId}`
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Quiz data for editing:", data);
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
  }, [selectedQuizId]);

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
      const res = await fetch("http://localhost:5000/teacher/quiz/create", {
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
          teacherRegNo: "",
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
        setShowCreateForm(false);
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
    console.log("Selected Quiz ID:", selectedQuizId);
    console.log("Raw values:", {
      RegStartTime: editQuiz.RegStartTime,
      RegEndTime: editQuiz.RegEndTime,
      startTime: editQuiz.startTime,
      endTime: editQuiz.endTime,
    });
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

    console.log("Final update payload:", bodyToSend);

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
        `http://localhost:5000/teacher/quiz/update/${selectedQuizId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyToSend),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      alert("Quiz updated successfully!");
      setShowEditForm(false);
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
      teacherRegNo: "",
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
    setShowCreateForm(false);
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
    <div className="teacher-quiz-container">
      <h2>Teacher Quiz Portal</h2>
      <div className="button-group spaced">
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          Create Quiz
        </button>
        <button onClick={() => setShowEditForm(!showEditForm)}>
          Edit Quiz
        </button>
      </div>

      {showCreateForm && (
        <div className="create-quiz-form">
          <h3>Create New Quiz</h3>
          <input
            type="text"
            placeholder="Quiz Title"
            value={newQuiz.title}
            onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
          />
          <input
            type="text"
            placeholder="Course Code"
            value={newQuiz.course}
            onChange={(e) => setNewQuiz({ ...newQuiz, course: e.target.value })}
          />
          <select
            value={newQuiz.section}
            onChange={(e) =>
              setNewQuiz({ ...newQuiz, section: e.target.value })
            }
          >
            <option value="">Select Section</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Teacher Reg No"
            value={newQuiz.teacherRegNo}
            onChange={(e) =>
              setNewQuiz({ ...newQuiz, teacherRegNo: e.target.value })
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

          <h4 style={{ textAlign: "left" }}>📌 Quiz Registration Period</h4>
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

          <h4 style={{ textAlign: "left" }}>🕐 Quiz Schedule</h4>
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
          <input
            type="number"
            placeholder="Quiz Duration (in minutes)"
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
                value={q.questionText}
                onChange={(e) => updateQuestionText(qIndex, e.target.value)}
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
                value={q.correctAnswer}
                onChange={(e) => updateCorrectOption(qIndex, e.target.value)}
              >
                {q.options.map((_, optIndex) => (
                  <option key={optIndex} value={optIndex}>
                    {`Option ${optIndex + 1}`}
                  </option>
                ))}
              </select>
              <button onClick={() => removeQuestion(qIndex)}>Remove</button>
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

      {/* Edit Quiz Form */}
      {showEditForm && (
        <div className="quiz-form">
          <h3>Edit Quiz</h3>

          <div className="form-group">
            <label>Teacher Registration No*:</label>
            <input
              type="text"
              value={newQuiz.teacherRegNo}
              onChange={(e) =>
                setNewQuiz({ ...newQuiz, teacherRegNo: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Select Quiz:</label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              disabled={isFetchingQuizzes || !newQuiz.teacherRegNo}
            >
              <option value="">
                {isFetchingQuizzes
                  ? "Loading quizzes..."
                  : !newQuiz.teacherRegNo
                  ? "Enter teacher registration number first"
                  : teacherQuizzes.length === 0
                  ? "No quizzes found"
                  : "Select a quiz"}
              </option>
              {teacherQuizzes.map((quiz) => (
                <option key={quiz._id} value={quiz._id}>
                  {quiz.title} ({quiz.course} - {quiz.section})
                </option>
              ))}
            </select>
          </div>

          {editQuiz && (
            <>
              <div className="form-group">
                <label>Quiz Title*:</label>
                <input
                  type="text"
                  value={editQuiz.title}
                  onChange={(e) =>
                    setEditQuiz({ ...editQuiz, title: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Section:</label>
                <select
                  value={editQuiz.section}
                  onChange={(e) =>
                    setEditQuiz({ ...editQuiz, section: e.target.value })
                  }
                >
                  <option value="">Select Section</option>
                  {sections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div className="time-section">
                <h4>Registration Period</h4>
                <div className="form-group">
                  <label>Start Time:</label>
                  <input
                    type="datetime-local"
                    value={editQuiz.RegStartTime}
                    onChange={(e) =>
                      setEditQuiz({ ...editQuiz, RegStartTime: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>End Time:</label>
                  <input
                    type="datetime-local"
                    value={editQuiz.RegEndTime}
                    onChange={(e) =>
                      setEditQuiz({ ...editQuiz, RegEndTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="time-section">
                <h4>Quiz Schedule</h4>
                <div className="form-group">
                  <label>Start Time:</label>
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
                </div>
                <div className="form-group">
                  <label>End Time:</label>
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
                </div>
                <div className="form-group">
                  <label>Duration (minutes)*:</label>
                  <input
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
                  />
                </div>
              </div>

              <div className="questions-section">
                <h4>Questions</h4>
                {editQuiz.questions.map((q, qIndex) => (
                  <div className="question-card" key={qIndex}>
                    <div className="form-group">
                      <label>Question {qIndex + 1}:</label>
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) =>
                          updateEditQuestionText(qIndex, e.target.value)
                        }
                      />
                    </div>

                    <div className="options-group">
                      {q.options.map((opt, optIndex) => (
                        <div className="form-group" key={optIndex}>
                          <label>Option {optIndex + 1}:</label>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              updateEditOption(qIndex, optIndex, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="form-group">
                      <label>Correct Option:</label>
                      <select
                        value={q.correctAnswer}
                        onChange={(e) =>
                          updateEditCorrectOption(qIndex, e.target.value)
                        }
                      >
                        {q.options.map((_, optIndex) => (
                          <option key={optIndex} value={optIndex}>
                            Option {optIndex + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeEditQuestion(qIndex)}
                    >
                      Remove Question
                    </button>
                  </div>
                ))}

                <button className="add-btn" onClick={addEditQuestion}>
                  Add Question
                </button>
              </div>

              <button
                className="submit-btn"
                onClick={handleUpdateQuiz}
                // disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Quiz"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherQuiz;
