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
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Your Notes</h1>
        <Form action="/logout" method="post">
          <button type="submit">Logout of {user.email}</button>
        </Form>
      </header>
      <main style={{ display: "flex", gap: 24 }}>
        <div style={{ maxWidth: 240, minWidth: 120, width: "24vw" }}>
          {data.noteListItems.length === 0 ? (
            <p>No notes yet</p>
          ) : (
            <ul style={{ paddingLeft: 0 }}>
              {data.noteListItems.map((note) => (
                <li key={note.id}>
                  <Link to={note.id}>{note.title}</Link>
                </li>
              ))}
            </ul>
          )}
          <hr />
          <Link to="new">Create new note</Link>
        </div>
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
