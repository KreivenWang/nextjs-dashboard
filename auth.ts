import bcrypt from "bcrypt";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import postgres from "postgres";
import z from "zod";
import { User } from "./app/lib/definitions";
import { authConfig } from "./auth.config";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(email: string): Promise<User | null> {
  try {
    const user: User[] = await sql`SELECT * FROM users WHERE email = ${email}`;
    return user[0] || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  /**
   * The Credentials provider allows users to log in with a username and a password.
   */
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (user) {
            const passwordsMatch = await bcrypt.compare(
              password,
              user.password
            );
            if (passwordsMatch) {
              return user;
            }
          }
        }
        return null;
      },
    }),
  ],
});
