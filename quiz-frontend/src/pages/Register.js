 
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            const res = await fetch("http://localhost:5000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                navigate("/login");
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Error registering!");
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <input type="text" placeholder="Name" onChange={(e) => setName(e.target.value)} />
            <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            <select onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
            </select>
            <button onClick={handleRegister}>Register</button>
        </div>
    );
};

export default Register;
