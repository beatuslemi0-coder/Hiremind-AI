/**
 * Module-level hand-off for the local camera stream between the setup page
 * (where the user grants permission and tests their devices) and the live
 * session room. Reusing the stream avoids a second browser permission prompt
 * mid-flow and the "device still being released" race right after navigating.
 *
 * The stream is NOT stopped here — ownership transfers: whoever takes it
 * (the session room) becomes responsible for stopping its tracks.
 */
const cameraBus = { stream: null };

export function stashCameraStream(stream) {
  cameraBus.stream = stream;
}

export function takeCameraStream() {
  const stream = cameraBus.stream;
  cameraBus.stream = null;
  return stream || null;
}

export function peekCameraStream() {
  return cameraBus.stream;
}
