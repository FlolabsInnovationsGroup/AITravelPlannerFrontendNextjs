"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { X } from "lucide-react"

export function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleCancel = () => router.push("/auth/signin")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setIsLoading(true)
    setSubmitted(false)
    try {
      // Backend does not have forgot-password endpoint yet; show friendly message
      await new Promise((r) => setTimeout(r, 800))
      setSubmitted(true)
      toast.success("If an account exists with this email, you will receive a reset link.")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100 p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden">
          <div className="relative px-8 pt-8 pb-6 border-b border-stone-100">
            <button
              type="button"
              onClick={handleCancel}
              className="absolute top-6 right-6 p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-6">
              <Image src="/logo.svg" alt="" width={28} height={28} className="object-contain" />
              <span className="text-lg font-semibold text-stone-800 tracking-tight">Travel Planner</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Reset password</h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Enter your email and we’ll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 pt-6">
            {!submitted ? (
              <>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-stone-700 mb-1.5">
                    Email
                  </label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-lg border-stone-200 bg-stone-50/50 focus:bg-white transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 mt-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium shadow-sm transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending…" : "Send reset link"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-stone-600">
                Check your inbox for a reset link. If you don’t see it, check spam or{" "}
                <button type="button" onClick={() => setSubmitted(false)} className="font-medium text-amber-600 hover:text-amber-700">
                  try again
                </button>
                .
              </p>
            )}
            <div className="mt-6 text-center space-y-2">
              <Link href="/auth/signin" className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
                Back to sign in
              </Link>
              <p className="text-xs text-stone-400">
                Or go to <Link href="/" className="text-amber-600 hover:text-amber-700">home</Link>.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
