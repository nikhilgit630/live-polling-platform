"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { apiClient } from "@/lib/api"
import { Loader2, Plus, X } from "lucide-react"

interface CreatePollFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreatePollForm({ onSuccess, onCancel }: CreatePollFormProps) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate form
    if (!question.trim()) {
      setError("Question is required")
      setLoading(false)
      return
    }

    const validOptions = options.filter((opt) => opt.trim())
    if (validOptions.length < 2) {
      setError("At least 2 options are required")
      setLoading(false)
      return
    }

    try {
      await apiClient.createPoll(question.trim(), validOptions, isPublished)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create poll")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Poll</CardTitle>
        <CardDescription>Design your poll question and options</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="question">Poll Question</Label>
            <Textarea
              id="question"
              placeholder="What would you like to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Poll Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  disabled={loading}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeOption(index)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                disabled={loading}
                className="w-full bg-transparent"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} disabled={loading} />
            <Label htmlFor="published">Publish immediately</Label>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Poll
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
