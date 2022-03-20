import { useEffect, useState } from "react";
import {
  Form,
  json,
  useLoaderData,
  Outlet,
  Link,
  NavLink,
  useLocation,
} from "remix";
import type { LoaderFunction } from "remix";
import cn from "classnames";

import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import { getNoteListItems } from "~/models/note.server";

type LoaderData = {
  noteListItems: Awaited<ReturnType<typeof getNoteListItems>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const noteListItems = await getNoteListItems({ userId });
  return json<LoaderData>({ noteListItems });
};

export default function NotesPage() {
  const data = useLoaderData() as LoaderData;
  const location = useLocation();
  const user = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between overflow-x-auto overflow-y-hidden bg-slate-800 p-4 text-white">
        <h1 className="mr-2 text-3xl font-bold">
          <Link to=".">Notes</Link>
        </h1>
        <p className="mr-2">{user.email}</p>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>

      <main className="flex h-full overflow-x-hidden bg-white">
        <button
          className="border-r bg-gray-50 p-2 leading-none md:hidden"
          onClick={toggleMenu}
        >
          n<br />o<br />t<br />e<br />s
        </button>

        <div
          className={cn(
            "h-full overflow-x-hidden border-r bg-gray-50 md:w-80 md:min-w-[20rem]",
            "transition-all duration-150 ease-out",
            {
              "w-80 min-w-[20rem]": menuOpen,
              "w-0 min-w-0": !menuOpen,
            }
          )}
        >
          <div className="w-80 min-w-[20rem]">
            <Link to="new" className="block p-4 text-xl text-blue-500">
              + New Note
            </Link>

            <hr />

            {data.noteListItems.length === 0 ? (
              <p className="p-4">No notes yet</p>
            ) : (
              <ol>
                {data.noteListItems.map((note) => (
                  <li key={note.id}>
                    <NavLink
                      className={({ isActive }) =>
                        `block border-b p-4 text-xl ${
                          isActive ? "bg-white" : ""
                        }`
                      }
                      to={note.id}
                    >
                      📝 {note.title}
                    </NavLink>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="min-w-fit flex-1 p-6 md:min-w-min">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
