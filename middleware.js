/**
 * Force www → apex on every path (Vercel Edge Middleware).
 * vercel.json host redirects miss some directory index routes.
 */
export default function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  if (host === 'www.game2048.vip' || host.startsWith('www.game2048.vip:')) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    url.hostname = 'game2048.vip';
    url.port = '';
    return Response.redirect(url.toString(), 308);
  }
}

export const config = {
  matcher: '/:path*',
};
