import { NextRequest } from "next/server";

const BASE_URL = "http://localhost:3000";

/** Build a NextRequest like the ones route handlers and proxy.js receive. */
export function makeRequest(path, { method = "GET", body, rawBody, cookie, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers["content-type"] = "application/json";
  } else if (rawBody !== undefined) {
    init.body = rawBody;
  }
  if (cookie) init.headers.cookie = cookie;
  return new NextRequest(new URL(path, BASE_URL), init);
}

/** "sa_session=<token>" from a response's Set-Cookie, ready to send back. */
export function sessionCookieFrom(response) {
  const value = response.cookies.get("sa_session")?.value;
  return value ? `sa_session=${value}` : null;
}
