import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    /*
     * The authorized callback is used to verify if the request is authorized to access a page with Next.js Proxy.
     * It is called before a request is completed, and it receives an object with the auth and request properties.
     * The auth property contains the user's session, and the request property contains the incoming request.
     */
    authorized({ auth, request: { nextUrl } }) {
      // 在当前实现中，这个回调实际上不会被调用，
      // 因为路由保护逻辑在 proxy.ts 中间件中处理
      // 保留这个回调以备将来需要 NextAuth.js 特定的授权逻辑
      return true;
    },
  },
} satisfies NextAuthConfig;