// Retro SFX synthesizer using standard Web Audio API (Zero assets required, pure 8-bit synth!)
export const playRetroSound = (type: 'click' | 'success' | 'toggle') => {
  try {
    const isSfxEnabled = localStorage.getItem('orion_sfx_enabled') === 'true';
    if (!isSfxEnabled) return;

    // Create a new AudioContext
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'click') {
      // High-pitched 8-bit pop click sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } else if (type === 'success') {
      // Retro 8-bit success chime chord
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.24); // C6
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.42);
    } else if (type === 'toggle') {
      // Short retro chirp toggle switch sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(250, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, audioCtx.currentTime + 0.07);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    }
  } catch (e) {
    // Autoplay or policy blocked (no-op)
  }
};
