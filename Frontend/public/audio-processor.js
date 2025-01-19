class AudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      this.port.postMessage(input[0]); // Send raw audio data to the main thread
    }
    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
