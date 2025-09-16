"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { VotingInterface } from "@/components/polls/voting-interface"
import { apiClient, type Poll } from "@/lib/api"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PollPage() {
  const { id } = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    const loadPoll = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await apiClient.getPoll(id as string)
        setPoll(response.poll)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load poll")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadPoll()
    }
  }, [id, isAuthenticated, router])

  const handleBack = () => {
    router.push("/dashboard")
  }

  const handleVoteSuccess = (updatedPoll: Poll) => {
    setPoll(updatedPoll)
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading poll...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || "Poll not found"}</AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <VotingInterface poll={poll} onBack={handleBack} onVoteSuccess={handleVoteSuccess} />
      </main>
    </div>
  )
}
