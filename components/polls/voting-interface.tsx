"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { apiClient, type Poll } from "@/lib/api"
import { wsManager, type VoteUpdateData } from "@/lib/websocket"
import { Loader2, Users, Calendar, CheckCircle, ArrowLeft, Wifi, WifiOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"

interface VotingInterfaceProps {
  poll: Poll
  onBack?: () => void
  onVoteSuccess?: (poll: Poll) => void
}

export function VotingInterface({ poll: initialPoll, onBack, onVoteSuccess }: VotingInterfaceProps) {
  const [poll, setPoll] = useState<Poll>(initialPoll)
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userVotes, setUserVotes] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [recentVotes, setRecentVotes] = useState<any[]>([])
  const { token } = useAuth()

  useEffect(() => {
    // Check if user has already voted on this poll
    const checkUserVote = async () => {
      try {
        const response = await apiClient.getUserVotes()
        const pollVote = response.votes.find(
          (vote) => vote.pollOption && poll.options.some((option) => option.id === vote.pollOption.id),
        )
        if (pollVote) {
          setHasVoted(true)
          setSelectedOption(pollVote.pollOption.id)
        }
        setUserVotes(response.votes)
      } catch (err) {
        console.error("Failed to check user votes:", err)
      }
    }

    checkUserVote()
  }, [poll])

  useEffect(() => {
    if (token) {
      // Connect to WebSocket if not already connected
      if (!wsManager.isConnected()) {
        wsManager.connect(token)
      }

      // Join the poll room for real-time updates
      wsManager.joinPoll(poll.id)
      setIsConnected(wsManager.isConnected())

      // Listen for vote updates
      const handleVoteUpdate = (data: VoteUpdateData) => {
        console.log("[v0] Received vote update:", data)
        setPoll(data.results)

        // Add to recent votes list
        if (!data.vote.removed) {
          setRecentVotes((prev) => [data.vote, ...prev.slice(0, 4)]) // Keep last 5 votes
        }
      }

      // Listen for poll results
      const handlePollResults = (updatedPoll: Poll) => {
        console.log("[v0] Received poll results:", updatedPoll)
        setPoll(updatedPoll)
      }

      wsManager.onVoteUpdate(handleVoteUpdate)
      wsManager.onPollResults(handlePollResults)

      // Get initial poll results
      wsManager.getPollResults(poll.id)

      // Cleanup on unmount
      return () => {
        wsManager.offVoteUpdate(handleVoteUpdate)
        wsManager.offPollResults(handlePollResults)
        wsManager.leavePoll(poll.id)
      }
    }
  }, [poll.id, token])

  const handleVote = async () => {
    if (!selectedOption) return

    setLoading(true)
    setError("")

    try {
      const response = await apiClient.castVote(selectedOption)
      setHasVoted(true)
      onVoteSuccess?.(response.updatedPoll)
      // Real-time update will be handled by WebSocket
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cast vote")
    } finally {
      setLoading(false)
    }
  }

  const getHighestVoteCount = () => {
    return Math.max(...poll.options.map((option) => option._count?.votes || option.votes || 0))
  }

  const highestVotes = getHighestVoteCount()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Badge variant={poll.isPublished ? "default" : "secondary"}>{poll.isPublished ? "Published" : "Draft"}</Badge>
        </div>

        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center text-sm text-green-600">
              <Wifi className="h-4 w-4 mr-1" />
              Live
            </div>
          ) : (
            <div className="flex items-center text-sm text-muted-foreground">
              <WifiOff className="h-4 w-4 mr-1" />
              Offline
            </div>
          )}
        </div>
      </div>

      {/* Poll Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-tight">{poll.question}</CardTitle>
          <CardDescription className="flex items-center space-x-4">
            <span className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
            </span>
            <span className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              {poll.totalVotes} votes
            </span>
            <span>by {poll.creator.name}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hasVoted && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Thank you for voting! Results are updating in real-time.</AlertDescription>
            </Alert>
          )}

          {/* Voting Options */}
          {!hasVoted ? (
            <div className="space-y-4">
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button onClick={handleVote} disabled={!selectedOption || loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cast Vote
              </Button>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-4">
              {poll.options.map((option) => {
                const votes = option._count?.votes || option.votes || 0
                const percentage = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0
                const isWinning = votes === highestVotes && votes > 0
                const isUserChoice = selectedOption === option.id

                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isWinning ? "text-primary" : ""}`}>{option.text}</span>
                        {isUserChoice && (
                          <Badge variant="secondary" className="text-xs">
                            Your vote
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {votes} votes ({percentage}%)
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className={`h-3 transition-all duration-500 ${isUserChoice ? "bg-primary/20" : ""}`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {recentVotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Live votes as they come in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentVotes.map((vote, index) => (
                <div
                  key={`${vote.id}-${index}`}
                  className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded animate-in slide-in-from-top-2"
                >
                  <span>
                    {vote.user.name} voted for "{vote.pollOption.text}"
                  </span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(vote.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Poll Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{poll.totalVotes}</div>
              <div className="text-sm text-muted-foreground">Total Votes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{poll.options.length}</div>
              <div className="text-sm text-muted-foreground">Options</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isConnected ? "text-green-600" : "text-muted-foreground"}`}>
                {isConnected ? "LIVE" : "OFFLINE"}
              </div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
