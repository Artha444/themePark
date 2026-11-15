<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use LogicException;
use UnexpectedValueException;

class NeonAuthTokenVerifier
{
    /**
     * Verify a Managed Better Auth JWT against the branch JWKS.
     *
     * @return array<string, mixed>|null
     */
    public function verify(string $token): ?array
    {
        if (strlen($token) > 16384) {
            return null;
        }

        $segments = explode('.', $token);

        if (count($segments) !== 3) {
            return null;
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $segments;
        $header = $this->decodeJsonSegment($encodedHeader);
        $claims = $this->decodeJsonSegment($encodedPayload);

        if (! is_array($header)
            || ($header['alg'] ?? null) !== 'EdDSA'
            || ! is_string($header['kid'] ?? null)
            || ! is_array($claims)
        ) {
            return null;
        }

        $signature = $this->decodeBase64Url($encodedSignature);
        $baseUrl = (string) config('services.neon_auth.base_url');
        $urlParts = parse_url($baseUrl);

        if (! is_array($urlParts)
            || ($urlParts['scheme'] ?? null) !== 'https'
            || empty($urlParts['host'])
            || isset($urlParts['user'])
            || isset($urlParts['pass'])
            || isset($urlParts['query'])
            || isset($urlParts['fragment'])
        ) {
            throw new LogicException('NEON_AUTH_BASE_URL must be a valid HTTPS Auth URL.');
        }

        $origin = $urlParts['scheme'].'://'.$urlParts['host'];

        if (isset($urlParts['port'])) {
            $origin .= ':'.$urlParts['port'];
        }

        $expiration = $claims['exp'] ?? null;
        $audience = $claims['aud'] ?? null;
        $audiences = is_array($audience) ? $audience : [$audience];

        if (! is_string($claims['sub'] ?? null)
            || $claims['sub'] === ''
            || ! is_numeric($expiration)
            || (int) $expiration <= time()
            || ($claims['iss'] ?? null) !== $origin
            || ! in_array($origin, $audiences, true)
            || $signature === null
            || strlen($signature) !== SODIUM_CRYPTO_SIGN_BYTES
        ) {
            return null;
        }

        $jwksUrl = rtrim($baseUrl, '/').'/.well-known/jwks.json';
        $cacheKey = 'neon-auth-jwks:'.hash('sha256', $jwksUrl);
        $jwks = $this->cachedJwks($jwksUrl, $cacheKey);
        $key = $this->findSigningKey($jwks, $header['kid']);

        if ($key === null) {
            Cache::forget($cacheKey);
            $key = $this->findSigningKey($this->fetchJwks($jwksUrl), $header['kid']);
        }

        if ($key === null) {
            return null;
        }

        $publicKey = $this->decodeBase64Url($key['x']);

        if ($publicKey === null || strlen($publicKey) !== SODIUM_CRYPTO_SIGN_PUBLICKEYBYTES) {
            return null;
        }

        $signedContent = $encodedHeader.'.'.$encodedPayload;

        if (! sodium_crypto_sign_verify_detached($signature, $signedContent, $publicKey)) {
            return null;
        }

        return $claims;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeJsonSegment(string $segment): ?array
    {
        $decoded = $this->decodeBase64Url($segment);

        if ($decoded === null) {
            return null;
        }

        $value = json_decode($decoded, true);

        return is_array($value) ? $value : null;
    }

    private function decodeBase64Url(string $value): ?string
    {
        $padding = (4 - (strlen($value) % 4)) % 4;
        $decoded = base64_decode(strtr($value, '-_', '+/').str_repeat('=', $padding), true);

        return $decoded === false ? null : $decoded;
    }

    /**
     * @return array<string, mixed>
     */
    private function cachedJwks(string $url, string $cacheKey): array
    {
        return Cache::remember($cacheKey, now()->addMinutes(10), fn (): array => $this->fetchJwks($url));
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchJwks(string $url): array
    {
        $response = $this->httpClient()->get($url)->throw();
        $jwks = $response->json();

        if (! is_array($jwks) || ! is_array($jwks['keys'] ?? null)) {
            throw new UnexpectedValueException('Neon Auth returned an invalid JWKS document.');
        }

        return $jwks;
    }

    private function httpClient(): PendingRequest
    {
        return Http::acceptJson()->timeout(5);
    }

    /**
     * @param  array<string, mixed>  $jwks
     * @return array<string, mixed>|null
     */
    private function findSigningKey(array $jwks, string $keyId): ?array
    {
        foreach ($jwks['keys'] as $key) {
            if (is_array($key)
                && ($key['kid'] ?? null) === $keyId
                && ($key['kty'] ?? null) === 'OKP'
                && ($key['crv'] ?? null) === 'Ed25519'
                && (! isset($key['use']) || $key['use'] === 'sig')
                && (! isset($key['alg']) || $key['alg'] === 'EdDSA')
                && is_string($key['x'] ?? null)
            ) {
                return $key;
            }
        }

        return null;
    }
}
