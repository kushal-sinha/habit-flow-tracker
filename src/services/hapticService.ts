let HapticsModule: any = null;

try {
  // Dynamically load expo-haptics to prevent import-time crashes on incompatible clients
  HapticsModule = require('expo-haptics');
} catch (error) {
  console.log('[HapticService] expo-haptics native module is not available in this client.');
}

/**
 * Triggers physical haptic feedback based on completion milestones
 */
export const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' | 'success') => {
  if (!HapticsModule) return;

  try {
    switch (style) {
      case 'light':
        await HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Success);
        break;
      default:
        await HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    console.log('[HapticService] Haptic feedback execution error:', error);
  }
};
