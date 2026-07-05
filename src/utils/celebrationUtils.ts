export interface MilestoneInfo {
  milestoneLevel: 0 | 3 | 7 | 14 | 30 | 50 | 100;
  animationName: string;
  title: string;
  motivationalMessage: string;
  hapticStyle: 'light' | 'medium' | 'heavy' | 'success';
}

/**
 * Resolves standard days and streak milestones into specific titles, animations, 
 * motivational messages, and haptic feedback styles.
 */
export const getMilestoneInfo = (streak: number): MilestoneInfo => {
  let milestoneLevel: 0 | 3 | 7 | 14 | 30 | 50 | 100 = 0;
  let animationName = 'Wave';
  let title = 'Great job!';
  let motivationalMessage = 'Another step closer to your goals! Keep the momentum going.';
  let hapticStyle: 'light' | 'medium' | 'heavy' | 'success' = 'light';

  if (streak >= 100) {
    milestoneLevel = 100;
    animationName = 'Confetti Celebration';
    title = 'EXCEPTIONAL STREAK! 🎉';
    motivationalMessage = '100 days of absolute consistency. You have built a life-changing habit system!';
    hapticStyle = 'success';
  } else if (streak >= 50) {
    milestoneLevel = 50;
    animationName = 'Cheer';
    title = 'Legendary 50 Days! 🔥';
    motivationalMessage = 'Halfway to a century! Your dedication is inspiring. Take a moment to be proud!';
    hapticStyle = 'heavy';
  } else if (streak >= 30) {
    milestoneLevel = 30;
    animationName = 'Dance';
    title = '30-Day Milestone! 🏆';
    motivationalMessage = 'One full month of building a better you. You are unstoppable!';
    hapticStyle = 'heavy';
  } else if (streak >= 14) {
    milestoneLevel = 14;
    animationName = 'Trophy Lift';
    title = 'Fortnight Master! 🌟';
    motivationalMessage = 'Two weeks of focus. Your habits are cementing into your identity!';
    hapticStyle = 'medium';
  } else if (streak >= 7) {
    milestoneLevel = 7;
    animationName = 'Double Fist Pump';
    title = '7-Day Streak! 🙌';
    motivationalMessage = 'One complete week of showing up. You are setting a phenomenal pace!';
    hapticStyle = 'medium';
  } else if (streak >= 3) {
    milestoneLevel = 3;
    animationName = 'Happy Jump';
    title = '3-Day Streak! ⚡️';
    motivationalMessage = 'Three consecutive days! You are officially in the flow.';
    hapticStyle = 'medium';
  } else {
    // Normal day (deterministic rotation based on streak count to avoid repeat fatigue)
    const randomAnims = ['Wave', 'Cheer', 'Spin'];
    animationName = randomAnims[streak % randomAnims.length];
    
    const messages = [
      'Consistency is the key to unlocking your potential.',
      'Every small victory counts. Keep moving forward!',
      'You showed up today, and that is what matters most.',
      'Another deposit in your consistency bank. Well done!'
    ];
    motivationalMessage = messages[streak % messages.length];
    hapticStyle = 'light';
  }

  return { milestoneLevel, animationName, title, motivationalMessage, hapticStyle };
};
