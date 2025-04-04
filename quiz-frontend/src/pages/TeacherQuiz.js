import { useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/TeacherQuiz.css";

const TeacherQuiz = () => {
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
                value={q.correctOption}
                onChange={(e) => updateCorrectOption(qIndex, e.target.value)}
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
  );
};

export default TeacherQuiz;
