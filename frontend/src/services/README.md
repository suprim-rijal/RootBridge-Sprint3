# frontend/src/services

The only files that talk to the backend. http.js adds the token and turns failures into normal errors; api.js lists every endpoint as a named function, so pages never build URLs themselves.

## Files in this folder

- **api.js** (Member 5) - Every backend endpoint as a named function.
- **http.js** (Member 5) - The single place that calls the backend.
