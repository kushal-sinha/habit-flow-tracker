let AudioModule: any = null;

try {
  // Dynamically load expo-av to prevent crash at import time if native module is missing
  const expoAV = require('expo-av');
  AudioModule = expoAV.Audio;

  if (AudioModule) {
    AudioModule.setAudioModeAsync({
      playsInSilentModeIOS: true,
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

let ambientPlaybackInstance: any = null;
let currentAmbientKey: string | null = null;

/**
 * Plays ambient background music for the current level region
 */
export const playAmbientSound = async (soundKey: string, soundEnabled: boolean): Promise<boolean> => {
  if (!soundEnabled || !AudioModule) return false;

  try {
    // Toggle OFF if already playing the same region sound
    if (ambientPlaybackInstance && currentAmbientKey === soundKey) {
      await stopAmbientSound();
      return false;
    }

    // Stop existing if different region
    if (ambientPlaybackInstance) {
      await stopAmbientSound();
    }

    const soundURLs: { [key: string]: string } = {
      calm_village: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      deep_forest: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      mountain_wind: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      warrior_drums: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      cathedral_echo: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      cosmic_hum: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    };

    const url = soundURLs[soundKey] || soundURLs.calm_village;

    const { sound } = await AudioModule.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, isLooping: true, volume: 0.3 }
    );

    ambientPlaybackInstance = sound;
    currentAmbientKey = soundKey;
    return true;
  } catch (error) {
    console.log('[SoundService] Error playing ambient hum:', error);
    return false;
  }
};

/**
 * Stops any playing background sound
 */
export const stopAmbientSound = async () => {
  if (ambientPlaybackInstance) {
    try {
      await ambientPlaybackInstance.stopAsync();
      await ambientPlaybackInstance.unloadAsync();
    } catch {}
    ambientPlaybackInstance = null;
    currentAmbientKey = null;
  }
};
