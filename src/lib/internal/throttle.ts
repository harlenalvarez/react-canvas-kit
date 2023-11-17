function throttle60fps(callback: Function) {
  let lastTimestamp = 0;
  const frame = (timestamp: DOMHighResTimeStamp) => {
    const elapsed = timestamp - lastTimestamp;

    if (elapsed >= 16.67) { // 16.67 milliseconds is approximately 60 frames per second
      callback();
      lastTimestamp = timestamp;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
