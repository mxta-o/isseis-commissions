// An error that already knows its HTTP status. Throw it from anywhere in a request; the error
// handler turns it into { message } with that status. Anything else becomes a generic 500.
class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

module.exports = {
  HttpError,
}
