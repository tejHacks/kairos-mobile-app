import { Audio } from "expo-av";

let activeSound: Audio.Sound | null = null;

export async function playCustomSound(uri: string): Promise<void> {
  try {
    if (activeSound) {
      await activeSound.unloadAsync();
      activeSound = null;
    }

    // await Audio.setAudioModeAsync({
    //   playsInSilentModeIOS: true,
    //   staysActiveInBackground: false,
    //   shouldDuckAndroid: true,
    //   interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    //   allowsRecordingIOS: false,
    // });
await Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
  shouldDuckAndroid: true,
  allowsRecordingIOS: false,
  // remove interruptionModeAndroid — no longer needed in expo-av v14+
});
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 },
      (status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          activeSound = null;
        }
      },
    );

    activeSound = sound;
  } catch (error) {
    console.warn("[Kairos] Failed to play custom sound:", error);
  }
}

export async function stopCustomSound(): Promise<void> {
  if (activeSound) {
  try {
    await activeSound.stopAsync();
  } catch {}

  try {
    await activeSound.unloadAsync();
  } catch {}

  activeSound = null;
}
}
