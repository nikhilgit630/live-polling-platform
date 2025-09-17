"use client"

import { useEffect, useState } from "react"
import { apiClient, type Poll } from "@/lib/api"
import { wsManager, type NewPollData } from "@/lib/websocket"
import { PollCard } from "./poll-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Plus, Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import PollEditForm from "./EditPollModal"

interface PollsListProps {
  showUserPolls?: boolean
  onCreatePoll?: () => void
  onViewPoll?: (poll: Poll) => void
  onVotePoll?: (poll: Poll) => void
}

export function PollsList({ showUserPolls = false, onCreatePoll, onViewPoll, onVotePoll }: PollsListProps) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all")
  const [isConnected, setIsConnected] = useState(false)
  const { token } = useAuth()

  const loadPolls = async () => {
    try {
      setLoading(true)
      setError("")

      let response
      if (showUserPolls) {
        response = await apiClient.getUserPolls()
      } else {
        const publishedFilter = filter === "published" ? true : filter === "draft" ? false : undefined
        response = await apiClient.getPolls(publishedFilter)
      }

      setPolls(response.polls)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load polls")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPolls()
  }, [showUserPolls, filter])

  useEffect(() => {
    if (token && !showUserPolls) {
      // Connect to WebSocket if not already connected
      if (!wsManager.isConnected()) {
        wsManager.connect(token)
      }

      setIsConnected(wsManager.isConnected())

      // Listen for new polls
      const handleNewPoll = (data: NewPollData) => {
        console.log("[v0] New poll received:", data.poll)
        setPolls((prev) => [data.poll, ...prev])
      }

      wsManager.onNewPoll(handleNewPoll)

      return () => {
        wsManager.offNewPoll(handleNewPoll)
      }
    }
  }, [token, showUserPolls])

  const handleEdit = (poll: Poll) => {
    console.log("Edit poll:", poll.id);
    setSelectedPoll(poll);
  }; 

  const handleEditSuccess = (updatedPoll: Poll) => {
    // Ideally refetch polls or update state directly
    console.log("Poll updated:", updatedPoll);
  };

  const handleDelete = async (poll: Poll) => {
    if (window.confirm("Are you sure you want to delete this poll?")) {
      try {
        await apiClient.deletePoll(poll.id)
        await loadPolls() // Refresh the list
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete poll")
      }
    }
  }

  const filteredPolls = polls.filter((poll) => poll.question.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading polls...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold">{showUserPolls ? "My Polls" : "All Polls"}</h2>
            {!showUserPolls && (
              <div className="flex items-center space-x-1">
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
            )}
          </div>
          <p className="text-muted-foreground">
            {showUserPolls ? "Manage your created polls" : "Browse and vote on available polls"}
          </p>
        </div>

        {showUserPolls && onCreatePoll && (
          <Button onClick={onCreatePoll}>
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {showUserPolls && (
          <Select value={filter} onValueChange={(value: "all" | "published" | "draft") => setFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Polls</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Polls Grid */}
      {filteredPolls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No polls found matching your search." : "No polls available."}
          </p>
          {showUserPolls && onCreatePoll && (
            <Button onClick={onCreatePoll}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Poll
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              showActions={showUserPolls}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={onViewPoll}
              onVote={onVotePoll}
            />
          ))}
          </div>
      )}
      {selectedPoll && (
        <PollEditForm
          poll={selectedPoll}
          onClose={() => setSelectedPoll(null)}
          onSuccess= { handleEditSuccess }
        />
      )}
    </div>
  )
}
