import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, TextInput as RNTextInput, Animated, Modal } from 'react-native';
import { Text, HelperText, Switch } from 'react-native-paper';
import { tw } from '../utils/theme';
import { getTodayString } from '../utils/dateUtils';
import { useHabits } from '../hooks/useHabits';
import { Habit } from '../types';
import { triggerHaptic } from '../services/hapticService';

interface HabitFormModalProps {
  visible: boolean;
  habit: Habit | null; // Null if creating, Habit details if editing
  onClose: () => void;
}

const EMOJIS = ['📚', '🏃‍♂️', '💧', '🧘‍♂️', '🍎', '💻', '🛌', '🏋️‍♂️', '🚭', '🎨', '✍️', '🎹', '🚶‍♂️', '🦷', '🧹', '🥗', '🧠', '💸', '🌿', '🌅'];
const WEEKDAYS_LIST = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({ visible, habit, onClose }) => {
  const { addHabit, editHabit, habits } = useHabits();

  // Form states
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [category, setCategory] = useState('health');
  const [note, setNote] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('easy');
  
  const [repeatType, setRepeatType] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<string[]>([]);
  
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderHour, setReminderHour] = useState('09');
  const [reminderMinute, setReminderMinute] = useState('00');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Trigger scale/fade animation on visible change
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.94);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  // Load values if editing
  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setEmoji(habit.emoji);
      setCategory(habit.category);
      setNote(habit.note);
      setDifficulty(habit.difficulty || 'easy');
      
      if (typeof habit.repeatDays === 'string') {
        setRepeatType(habit.repeatDays as any);
        setCustomDays([]);
      } else {
        setRepeatType('custom');
        setCustomDays(habit.repeatDays);
      }

      if (habit.reminderTime) {
        setEnableReminder(true);
        const [h, m] = habit.reminderTime.split(':');
        setReminderHour(h);
        setReminderMinute(m);
      } else {
        setEnableReminder(false);
      }
    } else {
      // Default reset
      setTitle('');
      setEmoji(EMOJIS[0]);
      setCategory('health');
      setNote('');
      setRepeatType('daily');
      setCustomDays([]);
      setEnableReminder(false);
      setReminderHour('09');
      setReminderMinute('00');
      setDifficulty('easy');
    }
    setValidationError(null);
  }, [habit, visible]);

  const toggleCustomDay = (day: string) => {
    triggerHaptic('light');
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    triggerHaptic('medium');
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Habit name is required');
      return;
    }

    if (trimmedTitle.length > 50) {
      setValidationError('Name must be 50 characters or less');
      return;
    }

    if (note.length > 250) {
      setValidationError('Note must be 250 characters or less');
      return;
    }

    // Check duplicate name
    const duplicate = habits.find(
      (h) => (!habit || h.id !== habit.id) && h.title.toLowerCase() === trimmedTitle.toLowerCase() && !h.isArchived
    );
    if (duplicate) {
      setValidationError('A habit with this name already exists');
      return;
    }

    // Custom days verification
    if (repeatType === 'custom' && customDays.length === 0) {
      setValidationError('Please select at least one day for custom schedule');
      return;
    }

    // Validate reminder time
    let formattedReminder = null;
    if (enableReminder) {
      const h = parseInt(reminderHour, 10);
      const m = parseInt(reminderMinute, 10);
      if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
        setValidationError('Please enter a valid time (HH:MM)');
        return;
      }
      formattedReminder = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Determine final repeatDays parameter
    const repeatDaysParam = repeatType === 'custom' ? customDays : repeatType;

    const habitData = {
      title: trimmedTitle,
      emoji,
      category,
      color: 'indigo', // Lock theme color to premium brand indigo
      reminderTime: formattedReminder,
      repeatDays: repeatDaysParam as any,
      startDate: habit ? habit.startDate : getTodayString(),
      note: note.trim(),
      difficulty,
    };

    setLoading(true);
    let result;
    if (habit) {
      result = await editHabit(habit.id, habitData);
    } else {
      result = await addHabit(habitData);
    }
    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setValidationError(result.error || 'Failed to save habit');
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              transform: [{ scale: scaleAnim }], 
              opacity: opacityAnim 
            }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`max-h-165`}
          >
            <ScrollView contentContainerStyle={tw`p-6`} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <Text style={tw`text-2xl font-black text-white mb-4`}>
                {habit ? 'Edit Habit' : 'New Habit'}
              </Text>

              {validationError && (
                <HelperText type="error" visible={true} style={tw`mb-3 text-sm font-semibold`}>
                  ⚠️ {validationError}
                </HelperText>
              )}

              {/* Title Input wrapper */}
              <View style={[styles.inputWrapper, focusedField === 'title' && styles.inputWrapperFocused]}>
                <RNTextInput
                  placeholder="Habit Name (e.g., Read 30 minutes)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    setValidationError(null);
                  }}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  maxLength={50}
                  style={styles.textInput}
                />
              </View>

              {/* Emoji Selection Grid */}
              <Text style={styles.sectionTitle}>Select Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4 flex-row py-1`}>
                {EMOJIS.map((e) => {
                  const isSelected = emoji === e;
                  return (
                    <TouchableOpacity
                      key={e}
                      onPress={() => {
                        triggerHaptic('light');
                        setEmoji(e);
                      }}
                      activeOpacity={0.8}
                      style={[styles.emojiCard, isSelected && styles.emojiCardSelected]}
                    >
                      <Text style={tw`text-xl`}>{e}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Category selection pill */}
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.pillsRow}>
                {['health', 'mindful', 'work', 'fitness'].map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        triggerHaptic('light');
                        setCategory(cat);
                      }}
                      activeOpacity={0.8}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Difficulty selection pill */}
              <Text style={styles.sectionTitle}>Difficulty & Rewards</Text>
              <View style={styles.pillsRow}>
                {['easy', 'hard'].map((diff) => {
                  const isSelected = difficulty === diff;
                  const label = diff === 'easy' ? 'Easy (+10 XP)' : 'Hard (+20 XP)';
                  return (
                    <TouchableOpacity
                      key={diff}
                      onPress={() => {
                        triggerHaptic('light');
                        setDifficulty(diff as any);
                      }}
                      activeOpacity={0.8}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Schedule Repeats */}
              <Text style={styles.sectionTitle}>Repeat Schedule</Text>
              <View style={styles.pillsRow}>
                {['daily', 'weekdays', 'weekends', 'custom'].map((type) => {
                  const isSelected = repeatType === type;
                  const label = type === 'daily' ? 'Daily' : type === 'weekdays' ? 'Mon-Fri' : type === 'weekends' ? 'Sat-Sun' : 'Custom';
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        triggerHaptic('light');
                        setRepeatType(type as any);
                      }}
                      activeOpacity={0.8}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {repeatType === 'custom' && (
                <View style={styles.customDaysWrapper}>
                  {WEEKDAYS_LIST.map((d) => {
                    const isSelected = customDays.includes(d.key);
                    return (
                      <TouchableOpacity
                        key={d.key}
                        onPress={() => toggleCustomDay(d.key)}
                        activeOpacity={0.8}
                        style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}
                      >
                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Reminders Toggle & Setting */}
              <View style={[styles.reminderCard, enableReminder && styles.reminderCardActive]}>
                <View style={tw`flex-row justify-between items-center`}>
                  <View>
                    <Text style={tw`text-sm font-bold text-white`}>Daily Reminder</Text>
                    <Text style={tw`text-xs text-white/55`}>Get notified to log your habit</Text>
                  </View>
                  <Switch
                    value={enableReminder}
                    onValueChange={(val) => {
                      triggerHaptic('light');
                      setEnableReminder(val);
                    }}
                    color="#8B5CF6"
                  />
                </View>

                {enableReminder && (
                  <View style={styles.reminderTimePicker}>
                    <RNTextInput
                      value={reminderHour}
                      onChangeText={(val) => setReminderHour(val.replace(/[^0-9]/g, '').slice(0, 2))}
                      maxLength={2}
                      keyboardType="number-pad"
                      style={styles.timeInput}
                      placeholder="HH"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                    />
                    <Text style={tw`mx-3 text-lg font-black text-white`}>:</Text>
                    <RNTextInput
                      value={reminderMinute}
                      onChangeText={(val) => setReminderMinute(val.replace(/[^0-9]/g, '').slice(0, 2))}
                      maxLength={2}
                      keyboardType="number-pad"
                      style={styles.timeInput}
                      placeholder="MM"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                    />
                  </View>
                )}
              </View>

              {/* Optional Note */}
              <View style={[styles.inputWrapper, { height: 90, paddingVertical: 12 }, focusedField === 'note' && styles.inputWrapperFocused]}>
                <RNTextInput
                  placeholder="Notes (Optional: e.g. 15 pages in morning)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={note}
                  onChangeText={setNote}
                  onFocus={() => setFocusedField('note')}
                  onBlur={() => setFocusedField(null)}
                  maxLength={250}
                  multiline
                  numberOfLines={3}
                  style={[styles.textInput, { textAlignVertical: 'top', flex: 1 }]}
                />
              </View>

              {/* Actions Cancel & Save */}
              <View style={tw`flex-row justify-end items-center gap-3 mt-4`}>
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>
                    {loading ? 'Saving...' : habit ? 'Save' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 8, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: 'rgba(24, 28, 40, 0.95)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    backgroundColor: 'rgba(22, 25, 36, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    justifyContent: 'center',
    marginBottom: 16,
  },
  inputWrapperFocused: {
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emojiCard: {
    height: 52,
    width: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 32, 46, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 10,
  },
  emojiCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 4,
    height: 48,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pill: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  customDaysWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 2,
    backgroundColor: 'rgba(28, 32, 46, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    borderRadius: 20,
  },
  dayCircle: {
    height: 38,
    width: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dayCircleSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  reminderCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 28, 40, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  reminderCardActive: {
    borderColor: 'rgba(139, 92, 246, 0.35)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  reminderTimePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  timeInput: {
    width: 58,
    height: 38,
    backgroundColor: 'rgba(22, 25, 36, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelBtn: {
    width: 90,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    width: 110,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
