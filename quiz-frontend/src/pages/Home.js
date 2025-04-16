import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from "@mui/material";
import DarkModeToggle from "../components/DarkModeToggle";

const Home = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [otpExpiry, setOtpExpiry] = useState(120);
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setcPassword] = useState("");
  const [role, setRole] = useState("student");
  const [otp, setOtp] = useState("");

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!registrationNumber || !password) {
      setErrors({ fields: "All fields must be filled" });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber, password }),
      });

      const data = await res.json();

      if (res.ok && data.role) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("registrationNumber", data.registrationNumber);
        localStorage.setItem("section", data.section);
        localStorage.setItem("name", data.name);
        localStorage.setItem("darkMode", true);

        setTimeout(() => {
          const storedRole = localStorage.getItem("role");
          navigate(storedRole === "teacher" ? "/TeacherDash" : "/StudentDash");
        }, 200);
      } else {
        const msg =
          data.error === "User not found"
            ? "User not found. Check registration number."
            : data.error === "Invalid credentials"
            ? "Incorrect password. Try again."
            : "Login failed. Try later.";
        setErrors({ fields: msg });
      }
    } catch (err) {
      setErrors({ fields: "Network error. Try again." });
    }
  };

  const sendOtp = async () => {
    if (!name || !registrationNumber || !email || !password || !cpassword) {
      setErrors({ fields: "All fields must be filled" });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrors({ email: "Invalid email format" });
      return;
    }

    if (password !== cpassword) {
      setErrors({ confirmPassword: "Passwords must match" });
      return;
    }

    const validReg =
      role === "student"
        ? /^122\d{5}$/.test(registrationNumber)
        : /^\d{5}$/.test(registrationNumber);

    if (!validReg) {
      setErrors({
        registrationNumber:
          role === "student"
            ? "Format: 122XXXXX"
            : "Teacher format: 5 digits only",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep(2);
        startOtpCountdown();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Error sending OTP.");
    }
  };

  const verifyOtpAndRegister = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          name,
          password,
          role,
          registrationNumber,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Registration successful!");
        window.location.href = "/";
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Error verifying OTP.");
    }
  };

  const startOtpCountdown = () => {
    setOtpExpiry(120);
    setIsOtpExpired(false);

    let timeLeft = 120;
    const timer = setInterval(() => {
      timeLeft -= 1;
      setOtpExpiry(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timer);
        setIsOtpExpired(true);
      }
    }, 1000);
  };

  return (
    <Box sx={{ p: 2, maxWidth: 480, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" fontWeight={600}>
          Quiz Portal
        </Typography>
        <DarkModeToggle />
      </Box>

      <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
        <Tabs
          value={isLogin ? 0 : 1}
          onChange={(_, val) => setIsLogin(val === 0)}
          centered
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        <Divider sx={{ my: 2 }} />

        {isLogin ? (
          <>
            <TextField
              label="Registration Number"
              fullWidth
              size="small"
              margin="normal"
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              size="small"
              margin="normal"
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.fields && (
              <Typography color="error">{errors.fields}</Typography>
            )}
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleLogin}
            >
              Login
            </Button>
          </>
        ) : step === 1 ? (
          <>
            <TextField
              label="Name"
              fullWidth
              size="small"
              margin="normal"
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Registration Number"
              fullWidth
              size="small"
              margin="normal"
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
            {errors.registrationNumber && (
              <Typography color="error">{errors.registrationNumber}</Typography>
            )}
            <TextField
              label="Email"
              fullWidth
              size="small"
              margin="normal"
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <Typography color="error">{errors.email}</Typography>
            )}
            <TextField
              label="Password"
              type="password"
              fullWidth
              size="small"
              margin="normal"
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              size="small"
              margin="normal"
              onChange={(e) => setcPassword(e.target.value)}
            />
            {errors.confirmPassword && (
              <Typography color="error">{errors.confirmPassword}</Typography>
            )}

            <RadioGroup
              row
              value={role}
              onChange={(e) => setRole(e.target.value)}
              sx={{ my: 1 }}
            >
              <FormControlLabel
                value="student"
                control={<Radio />}
                label="Student"
              />
              <FormControlLabel
                value="teacher"
                control={<Radio />}
                label="Teacher"
              />
            </RadioGroup>

            {errors.fields && (
              <Typography color="error">{errors.fields}</Typography>
            )}
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={sendOtp}
            >
              Send OTP
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6">
              OTP sent to <strong>{email}</strong>
            </Typography>
            <Typography color={isOtpExpired ? "error" : "text.secondary"}>
              {isOtpExpired ? "OTP expired" : `OTP expires in ${otpExpiry}s`}
            </Typography>

            <TextField
              label="Enter OTP"
              fullWidth
              margin="normal"
              onChange={(e) => setOtp(e.target.value)}
            />

            {isOtpExpired ? (
              <Button variant="outlined" fullWidth onClick={sendOtp}>
                Resend OTP
              </Button>
            ) : (
              <Button fullWidth disabled>
                Wait ({otpExpiry}s)
              </Button>
            )}

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={verifyOtpAndRegister}
            >
              Register
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Home;
