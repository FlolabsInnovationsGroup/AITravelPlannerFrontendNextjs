'use client';

import { usePathname } from 'next/navigation';

export default function NotFound() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col justify-center items-center h-screen">
            <div className="flex flex-col">
                <a href="/" className="flex items-center no-underline text-black mb-8">
                    <img src="/logo.svg" alt="Flomad Logo" className="w-16 h-16 mr-3" />
                    <span className="text-lg">Flomad Travel</span>
                </a>
                <h2 className="text-2xl font-normal">
                    Page not found
                </h2>
                <div className="text-base font-normal">
                    The requested URL <code className="text-black font-mono">'{pathname}'</code> was not found on this server.
                </div>
            </div>
        </div>
    );
}