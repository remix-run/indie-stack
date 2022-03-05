import { Link } from "remix";
import { useOptionalUser } from "~/utils";

export default function Index() {
  const user = useOptionalUser();
  return (
    <div className="max-w-lg mt-[30vh] mx-auto p-8 bg-white rounded-md">
      <div className="text-center pb-4">
        <h1 className="text-5xl">Remix Indie Stack</h1>
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
          <Link className="underline text-blue-500" to="/notes">
            Check your notes
          </Link>
        ) : (
          <Link className="underline text-blue-500" to="/login">
            Login
          </Link>
        )}
      </div>
      <div>
        <p>
          <strong>Welcome to the Remix Indie Stack!</strong>
          <br />
          Please check the README.md file for instructions on how to get this
          project deployed.
        </p>
        <p className="pt-4">Learn more about Remix:</p>
        <ul className="pt-2 list-disc list-inside">
          <li>
            <a
              className="underline text-blue-500"
              href="https://remix.run/docs"
            >
              Remix Docs
            </a>
          </li>
          <li>
            <a
              className="underline text-blue-500"
              href="https://remix.run/stacks"
            >
              Remix Stacks
            </a>
          </li>
          <li>
            <a
              className="underline text-blue-500"
              href="https://rmx.as/discord"
            >
              Remix Discord Community
            </a>
          </li>
          <li>
            <a
              className="underline text-blue-500"
              href="https://github.com/remix-run/remix"
            >
              Remix GitHub
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
