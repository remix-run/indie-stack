import { createCookieSessionStorage, redirect } from "remix";
import invariant from "tiny-invariant";
import { getUserById } from "./models/user.server";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

const USER_SESSION_KEY = "userId";

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserId(request: Request) {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;
  return getUserById(userId);
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);
  return getUserById(userId);
}

export async function createUserSession(
  request: Request,
  userId: string,
  redirectTo: string
) {
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
