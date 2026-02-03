import { useFormik } from "formik";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import * as Yup from "yup";

export default function SignupPage() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      username: Yup.string().required("Username is required"),
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
        const response = await fetch("http://localhost:3000/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const data = await response.json();
        if (response.ok) {
          navigate("/login");
        } else {
          setError(data);
        }
      } catch (err) {
        console.error("Registration error:", err);
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
            name="username"
            type="text"
            placeholder="Username"
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.username && formik.errors.username && (
            <div className="formOneError">{formik.errors.username}</div>
          )}
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
            {formik.isSubmitting ? "Signing up..." : "Sign up"}
          </button>
        </form>
      </div>
      <div className="reroute">
        <button
          onClick={() => navigate("/login")}
          className="formOneButton"
          type="button"
        >
          Log in
        </button>
      </div>
    </div>
  );
}
