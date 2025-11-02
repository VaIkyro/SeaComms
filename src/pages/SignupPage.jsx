import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      alert("Account created! You can now log in.");
      navigate("/login");
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Create Your Account</h2>
      <form onSubmit={handleSignup} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Sign Up</button>
      </form>
      <p style={{ marginTop: "10px" }}>
        Already have an account? <Link to="/login" style={styles.link}>Login</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "30px",
    backgroundColor: "#2c2c2c",
    borderRadius: "12px",
    textAlign: "center",
    color: "#f5f5f5",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
  },
  heading: {
    marginBottom: "20px",
    color: "#ffd700"
  },
  form: {
    display: "flex",
    flexDirection: "column"
  },
  input: {
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "6px",
    border: "none",
    fontSize: "16px"
  },
  button: {
    padding: "10px",
    backgroundColor: "#ffd700",
    color: "#1a1a1a",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  link: {
    color: "#ffd700",
    textDecoration: "none"
  }
};
