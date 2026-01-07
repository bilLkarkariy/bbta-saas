import { cn } from "@/lib/utils";

interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

export function IconMessages({ className, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-6 h-6", className)}
            {...props}
        >
            <defs>
                <linearGradient id="msg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="oklch(var(--primary))" />
                    <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
            </defs>
            <path
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                fill="url(#msg-grad)"
                fillOpacity="0.1"
                stroke="url(#msg-grad)"
            />
            <path d="M8 11h.01" stroke="currentColor" strokeWidth="3" />
            <path d="M12 11h.01" stroke="currentColor" strokeWidth="3" />
            <path d="M16 11h.01" stroke="currentColor" strokeWidth="3" />
        </svg>
    );
}

export function IconContacts({ className, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-6 h-6", className)}
            {...props}
        >
            <defs>
                <linearGradient id="users-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                </linearGradient>
            </defs>
            <circle cx="9" cy="7" r="4" fill="url(#users-grad)" fillOpacity="0.1" stroke="url(#users-grad)" />
            <path d="M10 15H6a4 4 0 0 0-4 4v2" stroke="url(#users-grad)" />
            <path d="M16 21v-2a4 4 0 0 0-3-3.87" stroke="url(#users-grad)" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="url(#users-grad)" />
        </svg>
    );
}

export function IconTarget({ className, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-6 h-6", className)}
            {...props}
        >
            <defs>
                <linearGradient id="target-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#db2777" />
                </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" stroke="url(#target-grad)" />
            <circle cx="12" cy="12" r="6" stroke="url(#target-grad)" fill="url(#target-grad)" fillOpacity="0.1" />
            <circle cx="12" cy="12" r="2" fill="url(#target-grad)" />
            <path d="M4.93 4.93 7.76 7.76" stroke="url(#target-grad)" opacity="0.5" />
            <path d="M16.24 16.24 19.07 19.07" stroke="url(#target-grad)" opacity="0.5" />
        </svg>
    );
}

export function IconCalendar({ className, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-6 h-6", className)}
            {...props}
        >
            <defs>
                <linearGradient id="cal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
            </defs>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="url(#cal-grad)" fillOpacity="0.05" stroke="url(#cal-grad)" />
            <line x1="16" y1="2" x2="16" y2="6" stroke="url(#cal-grad)" />
            <line x1="8" y1="2" x2="8" y2="6" stroke="url(#cal-grad)" />
            <line x1="3" y1="10" x2="21" y2="10" stroke="url(#cal-grad)" />
            <path d="M8 14h.01" stroke="currentColor" strokeWidth="2.5" />
            <path d="M12 14h.01" stroke="currentColor" strokeWidth="2.5" />
            <path d="M16 14h.01" stroke="currentColor" strokeWidth="2.5" />
            <path d="M8 18h.01" stroke="currentColor" strokeWidth="2.5" />
            <path d="M12 18h.01" stroke="currentColor" strokeWidth="2.5" />
            <path d="M16 18h.01" stroke="currentColor" strokeWidth="2.5" />
        </svg>
    );
}
export function IconZapAnimated({ className, ...props }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-6 h-6", className)} {...props}>
            <defs>
                <linearGradient id="zap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
            </defs>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#zap-grad)" fillOpacity="0.2" stroke="url(#zap-grad)">
                {/* @ts-expect-error - SVG animate element not in React types */}
                <animate attributeName="stroke-opacity" values="1;0.5;1" duration="2s" repeatCount="indefinite" />
                {/* @ts-expect-error - SVG animate element not in React types */}
                <animate attributeName="fill-opacity" values="0.2;0.5;0.2" duration="2s" repeatCount="indefinite" />
            </path>
        </svg>
    )
}

export function IconShieldAnimated({ className, ...props }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-6 h-6", className)} {...props}>
            <defs>
                <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                </linearGradient>
            </defs>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#shield-grad)" fillOpacity="0.1" stroke="url(#shield-grad)" />
            <path d="m9 12 2 2 4-4" stroke="url(#shield-grad)" strokeWidth="2.5" strokeDasharray="10" strokeDashoffset="10">
                {/* @ts-expect-error - SVG animate element not in React types */}
                <animate attributeName="stroke-dashoffset" values="10;0" duration="1s" begin="0.5s" fill="freeze" />
            </path>
        </svg>
    )
}

export function IconUsersAnimated({ className, ...props }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-6 h-6", className)} {...props}>
            <defs>
                <linearGradient id="users-anim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
            </defs>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="url(#users-anim-grad)" />
            <circle cx="9" cy="7" r="4" stroke="url(#users-anim-grad)" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="url(#users-anim-grad)" opacity="0.5" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="url(#users-anim-grad)" opacity="0.5" />
        </svg>
    )
}

export function IconGlobeAnimated({ className, ...props }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-6 h-6", className)} {...props}>
            <defs>
                <linearGradient id="globe-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" stroke="url(#globe-grad)" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" stroke="url(#globe-grad)" opacity="0.7">
                {/* @ts-expect-error - SVG animate element not in React types */}
                <animate attributeName="d" values="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20;M12 2a5 5 0 0 0 0 20 5 5 0 0 0 0-20;M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" duration="4s" repeatCount="indefinite" />
            </path>
            <path d="M2 12h20" stroke="url(#globe-grad)" />
        </svg>
    )
}

export function IconCpuAnimated({ className, ...props }: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-6 h-6", className)} {...props}>
            <defs>
                <linearGradient id="cpu-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
            </defs>
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="url(#cpu-grad)" />
            <rect x="9" y="9" width="6" height="6" fill="url(#cpu-grad)" fillOpacity="0.2" stroke="none">
                {/* @ts-expect-error - SVG animate element not in React types */}
                <animate attributeName="opacity" values="0.2;0.6;0.2" duration="1.5s" repeatCount="indefinite" />
            </rect>
            <path d="M9 1v3" stroke="url(#cpu-grad)" opacity="0.5" />
            <path d="M15 1v3" stroke="url(#cpu-grad)" opacity="0.5" />
            <path d="M9 20v3" stroke="url(#cpu-grad)" opacity="0.5" />
            <path d="M15 20v3" stroke="url(#cpu-grad)" opacity="0.5" />
            <path d="M20 9h3" stroke="url(#cpu-grad)" opacity="0.5" />
            <path d="M20 14h3" stroke="url(#cpu-grad)" opacity="0.5" />
            <path d="M1 9h3" stroke="url(#cpu-grad)" opacity="0.5" />
            <path d="M1 14h3" stroke="url(#cpu-grad)" opacity="0.5" />
        </svg>
    )
}
