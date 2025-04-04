import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/teacher/students/no-section")
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => console.error(err));
  }, []);

  const updateSection = async (id, section) => {
    await fetch(`http://localhost:5000/teacher/update-section/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section }),
    });

    alert("Section updated!");
    setStudents(students.filter((student) => student._id !== id)); // Remove from list
  };

  return (
    <div>
      <Link to="/TeacherDash">
        <button>Dashboard</button>
      </Link>
      <Link to="/TeacherQuiz">
        <button>Quiz</button>
      </Link>
      <h2>Assign Sections to Students</h2>
      {students.map((student) => (
        <div key={student._id}>
          <h3>{student.email}</h3>
          <input
            type="text"
            placeholder="Section"
            onChange={(e) => (student.section = e.target.value)}
          />
          <button onClick={() => updateSection(student._id, student.section)}>
            Update
          </button>
        </div>
      ))}
    </div>
  );
};

export default TeacherDashboard;
