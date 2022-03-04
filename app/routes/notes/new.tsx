import * as React from "react";
import { Form, json, redirect, useActionData } from "remix";
import type { ActionFunction } from "remix";
import Alert from "@reach/alert";

import { createNote } from "~/models/note.server";
import { requireUserId } from "~/session.server";

type ActionData = {
  errors?: {
    title?: string;
    body?: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const title = formData.get("title");
  const body = formData.get("body");

  if (typeof title !== "string" || title.length === 0) {
    return json<ActionData>(
      { errors: { title: "Title is required" } },
      { status: 400 }
    );
  }

  if (typeof body !== "string" || body.length === 0) {
    return json<ActionData>(
      { errors: { body: "Body is required" } },
      { status: 400 }
    );
  }

  const note = await createNote(title, body, userId);

  return redirect(`/notes/${note.id}`);
};

export default function NewNotePage() {
  const actionData = useActionData<ActionData>();
  const titleRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.title) {
      titleRef.current?.focus();
    } else if (actionData?.errors?.body) {
      bodyRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      <div>
        <label>
          <span style={{ display: "block" }}>Title: </span>
          <input
            ref={titleRef}
            name="title"
            style={{ marginTop: 4, fontSize: "1.1rem", lineHeight: 2 }}
            aria-invalid={actionData?.errors?.title ? true : undefined}
            aria-errormessage={
              actionData?.errors?.title ? "title-error" : undefined
            }
          />
        </label>
        {actionData?.errors?.title && (
          <Alert style={{ color: "red" }} id="title=error">
            {actionData.errors.title}
          </Alert>
        )}
      </div>

      <div>
        <label>
          <span style={{ display: "block" }}>Body: </span>
          <textarea
            ref={bodyRef}
            name="body"
            rows={8}
            style={{
              marginTop: 4,
              width: "100%",
              fontSize: "1.1rem",
              lineHeight: 1.4,
            }}
            aria-invalid={actionData?.errors?.body ? true : undefined}
            aria-errormessage={
              actionData?.errors?.body ? "body-error" : undefined
            }
          />
        </label>
        {actionData?.errors?.body && (
          <Alert style={{ color: "red" }} id="body=error">
            {actionData.errors.body}
          </Alert>
        )}
      </div>

      <div>
        <button type="submit">Save</button>
      </div>
    </Form>
  );
}
