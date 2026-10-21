import { connection } from "next/server";

export async function requestTimestamp() {
  await connection();
  return Date.now();
}
