"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { PollsList } from "@/components/polls/polls-list"
import { CreatePollForm } from "@/components/polls/create-poll-form"
import { AnalyticsOverview } from "@/components/dashboard/analytics-overview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Poll } from "@/lib/api"

export default function DashboardPage() {
  const { isAuthenticated } = useAuth()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState("browse")

  if (!isAuthenticated) {
    return null // This will be handled by the auth context
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    setActiveTab("my-polls") // Switch to my polls tab after creating
  }

  const handleViewPoll = (poll: Poll) => {
    // TODO: Navigate to poll detail page
    console.log("View poll:", poll.id)
  }

  const handleVotePoll = (poll: Poll) => {
    // TODO: Open voting interface
    console.log("Vote on poll:", poll.id)
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <CreatePollForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateForm(false)} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="browse">Browse Polls</TabsTrigger>
            <TabsTrigger value="my-polls">My Polls</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            <PollsList showUserPolls={false} onViewPoll={handleViewPoll} onVotePoll={handleVotePoll} />
          </TabsContent>

          <TabsContent value="my-polls" className="mt-6">
            <PollsList showUserPolls={true} onCreatePoll={() => setShowCreateForm(true)} onViewPoll={handleViewPoll} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
                <p className="text-muted-foreground">Track your polling performance and engagement</p>
              </div>
              <AnalyticsOverview />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
