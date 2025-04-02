import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await fetch("http://localhost:5000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("token", data.token);
                navigate("/dashboard");
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Error logging in!");
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
};

export default Login;
