"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Poll } from "@/lib/api"
import { Calendar, Users, Eye, Edit, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

interface PollCardProps {
  poll: Poll
  showActions?: boolean
  onEdit?: (poll: Poll) => void
  onDelete?: (poll: Poll) => void
  onView?: (poll: Poll) => void
  onVote?: (poll: Poll) => void
}

export function PollCard({ poll, showActions = false, onEdit, onDelete, onView, onVote }: PollCardProps) {
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const getHighestVoteCount = () => {
    return Math.max(...poll.options.map((option) => option._count?.votes || option.votes || 0))
  }

  const highestVotes = getHighestVoteCount()

  const handleVote = () => {
    router.push(`/poll/${poll.id}`)
  }

  const handleView = () => {
    router.push(`/poll/${poll.id}`)
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight mb-2">{poll.question}</CardTitle>
            <CardDescription className="flex items-center space-x-4 text-sm">
              <span className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                {formatDate(poll.createdAt)}
              </span>
              <span className="flex items-center">
                <Users className="mr-1 h-3 w-3" />
                {poll.totalVotes} votes
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={poll.isPublished ? "default" : "secondary"}>
              {poll.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {poll.options.map((option) => {
            const votes = option._count?.votes || option.votes || 0
            const percentage =
              option.percentage || (poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0)
            const isWinning = votes === highestVotes && votes > 0

            return (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${isWinning ? "text-primary" : ""}`}>{option.text}</span>
                  <span className="text-muted-foreground">
                    {votes} votes ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">Created by {poll.creator.name}</div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleView}>
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>

            {poll.isPublished && (
              <Button size="sm" onClick={handleVote}>
                Vote
              </Button>
            )}

            {showActions && (
              <>
                <Button variant="outline" size="sm" onClick={() => onEdit?.(poll)}>
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete?.(poll)}>
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
