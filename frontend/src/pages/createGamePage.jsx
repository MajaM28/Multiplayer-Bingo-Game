import { useFormik } from "formik";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import * as Yup from "yup";

export default function CreateGamePage() {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const formik = useFormik({
    initialValues: {
      gameName: "",
    },
    validationSchema: Yup.object({
      gameName: Yup.string()
        .required("Game Name is required!")
        .max(20, "Name can't be longer then 20 char"),
    }),
    onSubmit: async (values) => {
      setError("");
      try {
        const res = await fetch("http://localhost:3000/api/games", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: values.gameName,
            hostId: user.id,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          setError(errorData);
          return;
        }

        const newGame = await res.json();

        await fetch("http://localhost:3000/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            gameId: newGame.id,
            userId: user.id,
          }),
        });
        alert("Created game!");
        navigate(`/game/${newGame.id}`);
      } catch (err) {
        console.error("Game creation error:", err);
        setError("Server error. Please try again.");
      }
    },
  });

  let errorMess;
  if (error) {
    errorMess = <p className="errorText">{error}</p>;
  }
  return (
    <div className="gameFormContainer">
      <form className="gameForm" onSubmit={formik.handleSubmit}>
        <input
          name="gameName"
          type="text"
          placeholder="game name"
          value={formik.values.gameName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {formik.touched.gameName && formik.errors.gameName && (
          <div className="formOneError">{formik.errors.gameName}</div>
        )}
        <button
          className="formOneButton"
          type="submit"
          disabled={formik.isSubmitting}
        >
          Create Game!
        </button>
        <button
          className="formOneButton"
          type="button"
          onClick={() => navigate("/lobby")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
