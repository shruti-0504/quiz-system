import { useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/TeacherQuiz.css";

const TeacherQuiz = () => {
  const { id } = useParams();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAllotForm, setShowAllotForm] = useState(false);
  const [allotSection, setAllotSection] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const validateDuration = (duration, startTime, endTime) => {
    const value = parseInt(duration, 10);
    const start = new Date(startTime);
    const end = new Date(endTime);
    const maxDuration = (end - start) / (1000 * 60);

    if (value < 0) return 0;
    if (maxDuration > 0 && value > maxDuration) return maxDuration;
    return value;
  };

  const validateQuiz = () => {
    const requiredFields = [
      { field: "title", message: "Quiz title is required!" },
      { field: "course", message: "Course code is required!" },
      { field: "section", message: "Section is required!" },
      { field: "teacherRegNo", message: "Teacher registration number is required!" },
      { field: "password", message: "Password is required!" },
      { field: "duration", message: "Duration is required!" },
    ];

    for (const { field, message } of requiredFields) {
      if (!newQuiz[field].toString().trim()) return message;
    }

    if (!newQuiz.RegStartTime || !newQuiz.RegEndTime) {
      return "Registration start and end times are required!";
    }

    if (new Date(newQuiz.RegStartTime) >= new Date(newQuiz.RegEndTime)) {
      return "Registration end time must be after registration start time!";
    }

    if (!newQuiz.startTime || !newQuiz.endTime) {
      return "Start and end times are required!";
    }

    if (new Date(newQuiz.startTime) >= new Date(newQuiz.endTime)) {
      return "End time must be after quiz start time!";
    }

    if (new Date(newQuiz.RegEndTime) >= new Date(newQuiz.startTime)) {
      return "Quiz must start after registration ends!";
    }

    for (let q of newQuiz.questions) {
      if (!q.questionText.trim()) return "All questions must be filled!";
      if (q.options.some((opt) => !opt.trim())) return "All options must be filled!";
    }

    return null;
  };

  const handleCreateQuiz = async () => {
    const error = validateQuiz();
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

  const handleAllotQuiz = async () => {
    if (!allotSection.trim()) {
      alert("Section is required!");
      return;
    }

    setIsLoading(true);
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
      console.error("Allotment error:", err);
      alert("Error allotting quiz!");
    } finally {
      setIsLoading(false);
    }
  };

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
    updatedQuestions[qIndex].correctAnswer = parseInt(value, 10);
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

  return (
    <div className="teacher-quiz-container">
      <h2>Teacher Quiz Portal</h2>
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
            onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
          />
          <input
            type="text"
            placeholder="Course Code"
            value={newQuiz.course}
            onChange={(e) => setNewQuiz({ ...newQuiz, course: e.target.value })}
          />
          <input
            type="text"
            placeholder="Section"
            value={newQuiz.section}
            onChange={(e) =>
              setNewQuiz({ ...newQuiz, section: e.target.value })
            }
          />
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

          {/* <input
            type="datetime-local"
            placeholder="Registration Start Time"
            value={newQuiz.RegStartTime}
            onChange={(e) =>
              setNewQuiz({ ...newQuiz, RegStartTime: e.target.value })
            }
          />
          <input
            type="datetime-local"
            placeholder="Registration End Time"
            value={newQuiz.RegEndTime}
            onChange={(e) =>
              setNewQuiz({ ...newQuiz, RegEndTime: e.target.value })
            }
          />
          <input
            type="datetime-local"
            placeholder="Quiz Start Time"
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
            placeholder="Quiz End Time"
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
          /> */}
<h4 style={{ textAlign: "left" }}>📌 Quiz Registration Period</h4>
<input
  type="datetime-local"
  placeholder="Registration Start Time"
  value={newQuiz.RegStartTime}
  onChange={(e) =>
    setNewQuiz({ ...newQuiz, RegStartTime: e.target.value })
  }
/>
<input
  type="datetime-local"
  placeholder="Registration End Time"
  value={newQuiz.RegEndTime}
  onChange={(e) =>
    setNewQuiz({ ...newQuiz, RegEndTime: e.target.value })
  }
/>

<h4 style={{ textAlign: "left" }}>🕐 Quiz Schedule</h4>

<input
  type="datetime-local"
  placeholder="Quiz Start Time"
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
  placeholder="Quiz End Time"
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
  );
};

export default TeacherQuiz;
