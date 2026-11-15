import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

let client;

export function getNeonAuthClient() {
    const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

    if (!authUrl) {
        throw new Error('VITE_NEON_AUTH_URL belum dikonfigurasi.');
    }

    if (!client) {
        client = createAuthClient(authUrl, {
            adapter: BetterAuthReactAdapter({
                fetchOptions: {
                    credentials: 'include',
                },
            }),
        });
    }

    return client;
}
