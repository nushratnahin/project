<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class HandleCors
{
    /**
     * Headers to add to every response (and every OPTIONS preflight).
     * Using a specific origin with credentials=true (wildcards are blocked
     * by browsers when credentials are included).
     */
    private function corsHeaders(string $origin): array
    {
        // Allow the actual requester's origin so credentials work correctly.
        // Fall back to the configured FRONTEND_URL, then localhost:5173.
        $allowed = env('FRONTEND_URL', 'http://localhost:5173');

        return [
            'Access-Control-Allow-Origin'      => $allowed,
            'Access-Control-Allow-Methods'     => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers'     => 'Content-Type, Authorization, Accept, X-Requested-With',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Max-Age'           => '86400',
        ];
    }

    public function handle(Request $request, Closure $next)
    {
        $origin = $request->headers->get('Origin', '');

        // Handle preflight OPTIONS request — return 204 immediately with CORS headers.
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)->withHeaders($this->corsHeaders($origin));
        }

        /** @var \Illuminate\Http\Response $response */
        $response = $next($request);

        foreach ($this->corsHeaders($origin) as $key => $value) {
            $response->headers->set($key, $value);
        }

        return $response;
    }
}