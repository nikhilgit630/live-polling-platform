const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export interface User {
  id: string
  name: string
  email: string
}

export interface Poll {
  id: string
  question: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name: string
  }
  options: PollOption[]
  totalVotes: number
}

export interface PollOption {
  id: string
  text: string
  votes?: number
  percentage?: number
  _count?: {
    votes: number
  }
}

export interface Vote {
  id: string
  createdAt: string
  pollOption: {
    id: string
    text: string
  }
  poll: {
    id: string
    question: string
  }
}

export interface ApiResponse<T> {
  message?: string
  data?: T
  error?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    return this.request("/users/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return this.request("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request("/users/me")
  }

  // Poll endpoints
  async getPolls(published?: boolean): Promise<{ polls: Poll[]; count: number }> {
    const query = published !== undefined ? `?published=${published}` : ""
    return this.request(`/polls${query}`)
  }

  async getPoll(id: string): Promise<{ poll: Poll }> {
    return this.request(`/polls/${id}`)
  }

  async createPoll(question: string, options: string[], isPublished = false): Promise<{ poll: Poll }> {
    return this.request("/polls", {
      method: "POST",
      body: JSON.stringify({ question, options, isPublished }),
    })
  }

  async getUserPolls(): Promise<{ polls: Poll[]; count: number }> {
    return this.request("/polls/user/me")
  }

  async updatePoll(id: string, data: { question?: string; isPublished?: boolean }): Promise<{ poll: Poll }> {
    return this.request(`/polls/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deletePoll(id: string): Promise<{ message: string }> {
    return this.request(`/polls/${id}`, {
      method: "DELETE",
    })
  }

  // Vote endpoints
  async castVote(pollOptionId: string): Promise<{ vote: Vote; updatedPoll: Poll }> {
    return this.request(`/votes/${pollOptionId}`, {
      method: "POST",
    })
  }

  async getUserVotes(): Promise<{ votes: Vote[]; count: number }> {
    return this.request("/votes/user/me")
  }

  async getPollVotes(pollId: string): Promise<{ votes: Vote[]; count: number }> {
    return this.request(`/votes/poll/${pollId}`)
  }

  async removeVote(voteId: string): Promise<{ message: string; updatedPoll: Poll }> {
    return this.request(`/votes/${voteId}`, {
      method: "DELETE",
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
