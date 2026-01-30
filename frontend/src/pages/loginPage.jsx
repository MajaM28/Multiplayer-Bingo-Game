import { useFormik } from "formik";
// import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import * as Yup from "yup";

export default function LoginPage() {
  const [error, setError] = useState("");
  //   const navigate = useNavigate();
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
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: (values) => {
      setError("");
      console.log(values);
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
          <button className="formOneButton" type="submit">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
