import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login");
  }
  return (
    <div className="navbarContainer">
      <p>WELCOME TO BINGO ❀˖°</p>
      <button className="logoutButton" onClick={() => handleLogout()}>
        Log out
      </button>
    </div>
  );
}
