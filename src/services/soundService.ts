let AudioModule: any = null;

try {
  // Dynamically load expo-av to prevent crash at import time if native module is missing
  const expoAV = require('expo-av');
  AudioModule = expoAV.Audio;

  if (AudioModule) {
    AudioModule.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
    }).catch((err: any) => {
      console.log('[SoundService] Failed to set audio mode:', err);
    });
  }
} catch (error) {
  console.log('[SoundService] expo-av native module is not available in this client.');
}

/**
 * Preloads and plays the completion sound effect dynamically
 */
export const playSuccessSound = async (soundEnabled: boolean) => {
  if (!soundEnabled || !AudioModule) return;

  try {
    const { sound } = await AudioModule.Sound.createAsync(
      require('../../assets/success.mp3'),
      { shouldPlay: true }
    );

    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    console.log('[SoundService] Error loading or playing sound:', error);
  }
};
