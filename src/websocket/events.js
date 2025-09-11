// WebSocket event constants
const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // Authentication events
  AUTHENTICATE: "authenticate",
  AUTHENTICATED: "authenticated",
  AUTHENTICATION_ERROR: "authentication_error",

  // Poll room events
  JOIN_POLL: "join_poll",
  JOINED_POLL: "joined_poll",
  LEAVE_POLL: "leave_poll",
  LEFT_POLL: "left_poll",

  // Poll data events
  GET_POLL_RESULTS: "get_poll_results",
  POLL_RESULTS: "poll_results",

  // Real-time updates
  VOTE_UPDATE: "vote_update",
  NEW_POLL: "new_poll",
  POLL_UPDATE: "poll_update",
  POLL_PUBLISHED: "poll_published",

  // Error events
  ERROR: "error",
}

module.exports = { SOCKET_EVENTS }
