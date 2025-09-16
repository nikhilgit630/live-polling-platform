"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient, type Poll } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, Vote, BarChart3, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AnalyticsData {
  totalPolls: number
  totalVotes: number
  averageVotesPerPoll: number
  mostPopularPoll: Poll | null
  recentActivity: Poll[]
  pollsByMonth: { month: string; count: number }[]
  voteDistribution: { name: string; value: number; color: string }[]
}

export function AnalyticsOverview() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)

        // Fetch user's polls and all polls for analytics
        const [userPollsResponse, allPollsResponse] = await Promise.all([
          apiClient.getUserPolls(),
          apiClient.getPolls(true), // Only published polls
        ])

        const userPolls = userPollsResponse.polls
        const allPolls = allPollsResponse.polls

        // Calculate analytics
        const totalPolls = userPolls.length
        const totalVotes = userPolls.reduce((sum, poll) => sum + poll.totalVotes, 0)
        const averageVotesPerPoll = totalPolls > 0 ? Math.round(totalVotes / totalPolls) : 0

        // Find most popular poll
        const mostPopularPoll = userPolls.reduce(
          (prev, current) => (prev.totalVotes > current.totalVotes ? prev : current),
          userPolls[0] || null,
        )

        // Recent activity (last 5 polls)
        const recentActivity = userPolls
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        // Polls by month (last 6 months)
        const pollsByMonth = generateMonthlyData(userPolls)

        // Vote distribution for pie chart
        const voteDistribution = userPolls.slice(0, 5).map((poll, index) => ({
          name: poll.question.length > 30 ? poll.question.substring(0, 30) + "..." : poll.question,
          value: poll.totalVotes,
          color: `hsl(${120 + index * 60}, 70%, 50%)`,
        }))

        setAnalytics({
          totalPolls,
          totalVotes,
          averageVotesPerPoll,
          mostPopularPoll,
          recentActivity,
          pollsByMonth,
          voteDistribution,
        })
      } catch (error) {
        console.error("Failed to load analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  const generateMonthlyData = (polls: Poll[]) => {
    const months = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString("en-US", { month: "short" })
      const count = polls.filter((poll) => {
        const pollDate = new Date(poll.createdAt)
        return pollDate.getMonth() === date.getMonth() && pollDate.getFullYear() === date.getFullYear()
      }).length

      months.push({ month: monthName, count })
    }

    return months
  }

  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Polls</p>
                <p className="text-2xl font-bold">{analytics.totalPolls}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Votes</p>
                <p className="text-2xl font-bold">{analytics.totalVotes}</p>
              </div>
              <Vote className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Votes/Poll</p>
                <p className="text-2xl font-bold">{analytics.averageVotesPerPoll}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Most Popular</p>
                <p className="text-2xl font-bold">
                  {analytics.mostPopularPoll ? analytics.mostPopularPoll.totalVotes : 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Polls Created Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Polls Created (Last 6 Months)</CardTitle>
            <CardDescription>Track your poll creation activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.pollsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vote Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Vote Distribution</CardTitle>
            <CardDescription>Votes across your top polls</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.voteDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.voteDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest polls and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              analytics.recentActivity.map((poll) => (
                <div key={poll.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{poll.question}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center">
                        <Vote className="mr-1 h-3 w-3" />
                        {poll.totalVotes} votes
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{poll.totalVotes}</div>
                    <div className="text-xs text-muted-foreground">votes</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
