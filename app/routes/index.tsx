import { Link } from "remix";
import { useOptionalUser } from "~/utils";

export default function Index() {
  const user = useOptionalUser();
  return (
    <div
      style={{
        maxWidth: 500,
        margin: "30vh auto 0 auto",
      }}
    >
      <div style={{ textAlign: "center", paddingBottom: 16 }}>
        <h1>Remix Notes App</h1>
        <p>
          This app will get you started with Remix in no time.
          <br />
          {user ? (
            <>
              Hello <strong>{user.email}</strong> 👋
            </>
          ) : (
            `Feel free to login!`
          )}
        </p>
        {user ? (
          <Link to="/notes">Check your notes</Link>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
      <div>
        <p>
          <strong>Welcome to the Remix Fly Stack!</strong>
          <br />
          Please check the README.md file for instructions on how to get this
          project deployed.
        </p>
        <p>Learn more about Remix:</p>
        <ul>
          <li>
            <a href="https://remix.run/docs">Remix Docs</a>
          </li>
          <li>
            <a href="https://rmx.as/discord">Remix Discord Community</a>
          </li>
          <li>
            <a href="https://github.com/remix-run/remix">Remix GitHub</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
