import { Form, json, useLoaderData, Outlet, Link } from "remix";
import type { LoaderFunction } from "remix";

import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import { getNoteListItems } from "~/models/note.server";

type LoaderData = {
  noteListItems: Awaited<ReturnType<typeof getNoteListItems>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const noteListItems = await getNoteListItems(userId);
  return json<LoaderData>({ noteListItems });
};

export default function NotesPage() {
  const data = useLoaderData<LoaderData>();
  const user = useUser();

  return (
    <div className="mx-4 my-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl text-white">Your Notes</h1>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="bg-blue-700 text-blue-100 hover:bg-blue-900 focus:bg-blue-900 rounded-sm py-2 px-4"
          >
            Logout of {user.email}
          </button>
        </Form>
      </header>
      <main className="mt-8 py-8 px-6 bg-white rounded-lg flex flex-col md:flex-row gap-6 min-h-[50vh]">
        <div className="md:max-w-[240px] md:min-w-[120px] md:w-[24vw]">
          <Link to="new" className="text-blue-500 underline">
            Create new note
          </Link>
          <hr className="my-4" />
          {data.noteListItems.length === 0 ? (
            <p>No notes yet</p>
          ) : (
            <ol className="list-decimal list-inside">
              {data.noteListItems.map((note) => (
                <li key={note.id}>
                  <Link to={note.id} className="text-blue-500 underline">
                    {note.title}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
