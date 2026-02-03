import { useFormik } from "formik";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import * as Yup from "yup";

export default function LoginPage() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .trim()
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format") //before @ cantbe space or @,, @ , smothing after @ same rules, . , com/pl/whatever
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      setError("");
      try {
        const response = await fetch("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("user", JSON.stringify(data.user));
          console.log("Logged in user:", data.user);
          navigate("/lobby");
        } else {
          setError(data);
          alert("Not able to login!");
        }
      } catch (err) {
        console.error("Login error:", err);
        setError("Server error. Please try again.");
      }
    },
  });

  let errorMess;
  if (error) {
    errorMess = <p className="errorText">{error}</p>;
  }
  return (
    <div className="loginContainer">
      <div className="heroHeader">
        <h1>BINGO</h1>
      </div>
      <div className="loginFormContainer">
        <form className="loginForm" onSubmit={formik.handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.email && formik.errors.email && (
            <div className="formOneError">{formik.errors.email}</div>
          )}
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.password && formik.errors.password && (
            <div className="formOneError">{formik.errors.password}</div>
          )}
          {errorMess}
          <button
            className="formOneButton"
            type="submit"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
      <div className="reroute">
        <button
          onClick={() => navigate("/signup")}
          className="formOneButton"
          type="button"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
