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
    <div className="max-w-lg mt-[30vh] mx-auto p-8 bg-white rounded-md">
      <h1 className="text-center text-2xl pb-4">Join Remix Notes</h1>
      <Form method="post" className="flex flex-col gap-3 w-72 mx-auto">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label className="flex flex-col gap-1 w-full">
            <span>Email address</span>
            <input
              ref={emailRef}
              autoFocus={true}
              className="flex-1 leading-loose text-lg px-3 border-blue-500 border-2 rounded-md"
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
            <Alert className="text-red-700 pt-1" id="email-error">
              {actionData.errors.email}
            </Alert>
          )}
        </div>

        <div>
          <label className="flex flex-col gap-1 w-full">
            <span>Password</span>
            <input
              ref={passwordRef}
              className="flex-1 leading-loose text-lg px-3 border-blue-500 border-2 rounded-md"
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
            <Alert className="text-red-700 pt-1" id="password-error">
              {actionData.errors.password}
            </Alert>
          )}
        </div>

        <div className="text-right">
          <button
            type="submit"
            className="bg-blue-700 text-blue-100 hover:bg-blue-900 focus:bg-blue-900 rounded-sm py-2 px-4"
          >
            Join
          </button>
        </div>
      </Form>

      <div className="text-right pt-6">
        Already have an account?{" "}
        <Link
          className="text-blue-500 underline"
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
