'use client';

import Image from "next/legacy/image"
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-white">
            <div className="w-full max-w-md px-6">
                <Link href="/" className="flex items-center mb-8 no-underline">
                    <div className="relative w-6 h-6 mr-2">
                        <Image
                            src="/logo.png"
                            alt="Flomad Logo"
                            layout="fill"
                            objectFit="contain"
                        />
                    </div>
                    <span className="text-xl font-semibold text-black">Flomad Travel</span>
                </Link>

                <h1 className="text-2xl font-semibold mb-4">Page not found</h1>
                <p className="text-gray-600">
                    The requested URL <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">'{pathname}'</code> was not found on this server.
                </p>

                <div className="mt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}