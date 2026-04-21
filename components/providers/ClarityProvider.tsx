'use client';

import { useEffect } from 'react';
import clarity from '@microsoft/clarity';
import { useAuth } from '@/hooks/useAuth';

const CLARITY_PROJECT_ID = 'un49q0ij3v';

export function ClarityProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    useEffect(() => {
        // Initialize Clarity
        if (CLARITY_PROJECT_ID) {
            clarity.init(CLARITY_PROJECT_ID);
        }
    }, []);

    useEffect(() => {
        // Identify user when available
        if (user) {
            // Identify(customId, customSessionId, customPageId, friendlyName)
            clarity.identify(user.id, undefined, undefined, user.email);

            // Set custom tags
            clarity.setTag('user_id', user.id);
            if (user.email) clarity.setTag('email', user.email);

            const userRole = user.user_metadata?.role;
            if (userRole) {
                clarity.setTag('role', userRole);
            }
        }
    }, [user]);

    return <>{children}</>;
}
