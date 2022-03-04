import * as React from "react";
import type { ActionFunction, LoaderFunction, MetaFunction } from "remix";
import {
  Form,
  Link,
  redirect,
  useSearchParams,
  json,
  useActionData,
} from "remix";
import Alert from "@reach/alert";

import { getUserId, createUserSession } from "~/session.server";

import { createUser, getUserByEmail } from "~/models/user.server";
import { validateEmail } from "~/utils";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return {};
};

interface ActionData {
  errors: {
    email?: string;
    password?: string;
  };
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo");

  if (!validateEmail(email)) {
    return json<ActionData>(
      { errors: { email: "Email is invalid" } },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json<ActionData>(
      { errors: { password: "Password is required" } },
      { status: 400 }
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json<ActionData>(
      { errors: { email: "A user already exists with this email" } },
      { status: 400 }
    );
  }

  const user = await createUser(email, password);

  return createUserSession(
    request,
    user.id,
    typeof redirectTo === "string" ? redirectTo : "/"
  );
};

export const meta: MetaFunction = () => {
  return {
    title: "Join",
  };
};

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<ActionData>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "30vh auto 0 auto",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Join Remix Notes</h1>
      <Form
        method="post"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: 300,
          margin: "auto",
        }}
      >
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              width: "100%",
            }}
          >
            <span>Email address</span>
            <input
              ref={emailRef}
              autoFocus={true}
              style={{ flex: 1, lineHeight: 2, fontSize: "1.1rem" }}
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={actionData?.errors?.email ? true : undefined}
              aria-errormessage={
                actionData?.errors.email ? "email-error" : undefined
              }
            />
          </label>
          {actionData?.errors?.email && (
            <Alert style={{ color: "red", paddingTop: 4 }} id="email-error">
              {actionData.errors.email}
            </Alert>
          )}
        </div>

        <div>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              width: "100%",
            }}
          >
            <span>Password</span>
            <input
              ref={passwordRef}
              style={{ flex: 1, lineHeight: 2, fontSize: "1.1rem" }}
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={actionData?.errors?.password ? true : undefined}
              aria-errormessage={
                actionData?.errors.password ? "password-error" : undefined
              }
            />
          </label>
          {actionData?.errors?.password && (
            <Alert style={{ color: "red", paddingTop: 4 }} id="password-error">
              {actionData.errors.password}
            </Alert>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <button type="submit">Join</button>
        </div>
      </Form>

      <div style={{ paddingTop: 24, textAlign: "right" }}>
        Already have an account?{" "}
        <Link
          to={{
            pathname: "/login",
            search: redirectTo ? `?redirectTo=${redirectTo}` : undefined,
          }}
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
