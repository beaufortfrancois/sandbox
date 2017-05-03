self.addEventListener('message', async event => {
  const faceDetector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
  const faces = await faceDetector.detect(event.data);
  // HACK: I wish faces could be cloned.
  const message = {
    faces: JSON.stringify(faces.map(face => face.boundingBox))
  }
  self.postMessage(message);
});
