import type { PagesFunction } from "@cloudflare/workers-types";
export const onRequest: PagesFunction = async ({ request, env }) => {
  const u=new URL(request.url);
  const slug=decodeURIComponent(u.pathname.replace(/^\/+|\/+$/g,""));
  if(!slug || slug.includes("/") || slug.includes(".")) return env.ASSETS.fetch(request);
  const target=new URL("/chapter.html",request.url);
  target.searchParams.set("slug",slug);
  return env.ASSETS.fetch(new Request(target.toString(),request));
};
