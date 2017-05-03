self.addEventListener('message', async event => {
  const faceDetector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
  const faces = await faceDetector.detect(event.data);
  self.postMessage({faces: faces.map(face => face.boundingBox)});
});
