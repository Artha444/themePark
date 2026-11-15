<?php

namespace App\Http\Middleware;

use App\Services\NeonAuthTokenVerifier;
use Closure;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyNeonAuthToken
{
    public function __construct(private NeonAuthTokenVerifier $verifier) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if ($token === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        try {
            $claims = $this->verifier->verify($token);
        } catch (ConnectionException|RequestException $exception) {
            report($exception);

            return response()->json(['message' => 'Neon Auth is temporarily unavailable.'], 503);
        }

        if ($claims === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->attributes->set('neon_auth_claims', $claims);

        return $next($request);
    }
}
