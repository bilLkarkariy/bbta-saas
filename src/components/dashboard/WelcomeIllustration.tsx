export function WelcomeIllustration({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="oklch(var(--primary))" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="oklch(var(--primary))" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.3" />
                </linearGradient>
                <filter id="glass" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                </filter>
            </defs>

            {/* Abstract Background Shapes */}
            <circle cx="200" cy="150" r="100" fill="url(#grad1)" filter="url(#glass)" opacity="0.6" />
            <circle cx="250" cy="100" r="60" fill="url(#grad2)" filter="url(#glass)" opacity="0.5" />

            {/* Foreground Elements - Stylized Charts/Data */}
            <path
                d="M50 200 L120 160 L180 190 L250 120 L350 150"
                stroke="oklch(var(--foreground))"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
            />

            {/* Floating UI Elements */}
            <rect x="260" y="60" width="80" height="50" rx="8" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.2" />
            <rect x="270" y="70" width="40" height="6" rx="3" fill="white" fillOpacity="0.4" />
            <rect x="270" y="82" width="60" height="6" rx="3" fill="white" fillOpacity="0.2" />

            <circle cx="80" cy="80" r="20" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.1" />
            <circle cx="80" cy="80" r="8" fill="oklch(var(--primary))" />

            {/* Decorative Dots */}
            <circle cx="320" cy="220" r="4" fill="oklch(var(--primary))" opacity="0.5" />
            <circle cx="340" cy="200" r="3" fill="#818cf8" opacity="0.5" />
            <circle cx="60" cy="240" r="5" fill="#c084fc" opacity="0.4" />

        </svg>
    );
}
