import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Portal, Modal, TextInput, Button, SegmentedButtons, HelperText, Surface, Switch } from 'react-native-paper';
import { tw } from '../utils/theme';
import { getTodayString } from '../utils/dateUtils';
import { useHabits } from '../hooks/useHabits';
import { Habit } from '../types';

interface HabitFormModalProps {
  visible: boolean;
  habit: Habit | null; // Null if creating, Habit details if editing
  onClose: () => void;
}

const EMOJIS = ['📚', '🏃‍♂️', '💧', '🧘‍♂️', '🍎', '💻', '🛌', '🏋️‍♂️', '🚭', '🎨', '✍️', '🎹', '🚶‍♂️', '🦷', '🧹', '🥗', '🧠', '💸', '🌿', '🌅'];
const COLORS = [
  { name: 'coral', hex: '#FF453A' },
  { name: 'indigo', hex: '#5E5CE6' },
  { name: 'sky', hex: '#0A84FF' },
  { name: 'emerald', hex: '#34C759' },
  { name: 'amber', hex: '#FFD60A' },
  { name: 'purple', hex: '#BF5AF2' },
];
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
  const [color, setColor] = useState(COLORS[0].name);
  const [note, setNote] = useState('');
  
  const [repeatType, setRepeatType] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<string[]>([]);
  
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderHour, setReminderHour] = useState('09');
  const [reminderMinute, setReminderMinute] = useState('00');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load values if editing
  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setEmoji(habit.emoji);
      setCategory(habit.category);
      setColor(habit.color);
      setNote(habit.note);
      
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
      setColor(COLORS[0].name);
      setNote('');
      setRepeatType('daily');
      setCustomDays([]);
      setEnableReminder(false);
      setReminderHour('09');
      setReminderMinute('00');
    }
    setValidationError(null);
  }, [habit, visible]);

  const toggleCustomDay = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
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
      color,
      reminderTime: formattedReminder,
      repeatDays: repeatDaysParam as any,
      startDate: habit ? habit.startDate : getTodayString(),
      note: note.trim(),
    };

    setLoading(true);
    let result;
    if (habit) {
      result = await editHabit(habit.id, habitData);
    } else {
      result = await addHabit(duplicate ? { ...habitData, title: `${trimmedTitle} (New)` } : habitData);
    }
    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setValidationError(result.error || 'Failed to save habit');
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={tw`bg-iosBgLight dark:bg-iosBgDark m-5 rounded-3xl overflow-hidden border border-iosBorderLight dark:border-iosBorderDark`}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={tw`max-h-160`}
        >
          <ScrollView contentContainerStyle={tw`p-6`}>
            {/* Header */}
            <Text style={tw`text-2xl font-black text-iosTextLight dark:text-iosTextDark mb-4`}>
              {habit ? 'Edit Habit' : 'New Habit'}
            </Text>

            {validationError && (
              <HelperText type="error" visible={true} style={tw`mb-2 text-sm font-semibold`}>
                ⚠️ {validationError}
              </HelperText>
            )}

            {/* Input Title */}
            <TextInput
              label="Habit Name"
              placeholder="e.g. Read 30 minutes"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setValidationError(null);
              }}
              maxLength={50}
              mode="outlined"
              outlineColor={tw.color('iosBorderLight')}
              activeOutlineColor={tw.color('indigo')}
              style={tw`mb-4 bg-transparent`}
              textColor={tw.color('iosTextLight')}
            />

            {/* Emoji Selection Grid */}
            <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-2 uppercase tracking-wider`}>
              Select Icon
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4 flex-row py-1`}>
              {EMOJIS.map((e) => {
                const isSelected = emoji === e;
                return (
                  <TouchableOpacity
                    key={e}
                    onPress={() => setEmoji(e)}
                    style={[
                      tw`h-12 w-12 rounded-2xl items-center justify-center border mr-2.5`,
                      isSelected 
                        ? tw`bg-indigo/15 border-indigo` 
                        : tw`bg-iosCardLight dark:bg-iosCardDark border-iosBorderLight dark:border-iosBorderDark`
                    ]}
                  >
                    <Text style={tw`text-xl`}>{e}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Category presets */}
            <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-2 uppercase tracking-wider`}>
              Category
            </Text>
            <SegmentedButtons
              value={category}
              onValueChange={setCategory}
              buttons={[
                { value: 'health', label: 'Health' },
                { value: 'mindful', label: 'Mindful' },
                { value: 'work', label: 'Work' },
                { value: 'fitness', label: 'Fitness' },
              ]}
              style={tw`mb-4`}
              theme={{
                colors: {
                  secondaryContainer: tw.color('indigo/15') || '#E5E5EA',
                  onSecondaryContainer: tw.color('indigo'),
                }
              }}
            />

            {/* Colors Grid Selection */}
            <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-2 uppercase tracking-wider`}>
              Theme Color
            </Text>
            <View style={tw`flex-row mb-4`}>
              {COLORS.map((c) => {
                const isSelected = color === c.name;
                return (
                  <TouchableOpacity
                    key={c.name}
                    onPress={() => setColor(c.name)}
                    style={[
                      tw`h-9 w-9 rounded-full items-center justify-center mr-3 border-2`,
                      { backgroundColor: c.hex },
                      isSelected ? tw`border-iosTextLight dark:border-iosTextDark` : tw`border-transparent`
                    ]}
                  >
                    {isSelected && (
                      <Text style={tw`text-white font-bold text-xs`}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Schedule Repeats */}
            <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-2 uppercase tracking-wider`}>
              Repeat Schedule
            </Text>
            <SegmentedButtons
              value={repeatType}
              onValueChange={(v: any) => setRepeatType(v)}
              buttons={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekdays', label: 'Mon-Fri' },
                { value: 'weekends', label: 'Sat-Sun' },
                { value: 'custom', label: 'Custom' },
              ]}
              style={tw`mb-3`}
              theme={{
                colors: {
                  secondaryContainer: tw.color('indigo/15') || '#E5E5EA',
                  onSecondaryContainer: tw.color('indigo'),
                }
              }}
            />

            {repeatType === 'custom' && (
              <View style={tw`flex-row justify-between mb-4 mt-1 bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark p-2.5 rounded-2xl`}>
                {WEEKDAYS_LIST.map((d) => {
                  const isSelected = customDays.includes(d.key);
                  return (
                    <TouchableOpacity
                      key={d.key}
                      onPress={() => toggleCustomDay(d.key)}
                      style={[
                        tw`h-8 w-8 rounded-full items-center justify-center border`,
                        isSelected 
                          ? tw`bg-indigo border-indigo` 
                          : tw`bg-transparent border-iosBorderLight dark:border-iosBorderDark`
                      ]}
                    >
                      <Text style={[
                        tw`text-xs font-bold`,
                        isSelected ? tw`text-white` : tw`text-iosTextLight dark:text-iosTextDark`
                      ]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Reminders Toggle & Setting */}
            <Surface style={tw`p-4 rounded-2xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-4 shadow-sm`}>
              <View style={tw`flex-row justify-between items-center`}>
                <View>
                  <Text style={tw`text-sm font-bold text-iosTextLight dark:text-iosTextDark`}>Daily Reminder</Text>
                  <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark`}>Get notified to log your habit</Text>
                </View>
                <Switch
                  value={enableReminder}
                  onValueChange={setEnableReminder}
                  color={tw.color('indigo')}
                />
              </View>

              {enableReminder && (
                <View style={tw`flex-row items-center justify-center mt-3 pt-3 border-t border-iosBorderLight dark:border-iosBorderDark`}>
                  <TextInput
                    value={reminderHour}
                    onChangeText={(val) => setReminderHour(val.replace(/[^0-9]/g, '').slice(0, 2))}
                    maxLength={2}
                    keyboardType="number-pad"
                    style={tw`w-14 text-center h-10 bg-transparent`}
                    placeholder="HH"
                    textColor={tw.color('iosTextLight')}
                  />
                  <Text style={tw`mx-2 text-lg font-bold text-iosTextLight dark:text-iosTextDark`}>:</Text>
                  <TextInput
                    value={reminderMinute}
                    onChangeText={(val) => setReminderMinute(val.replace(/[^0-9]/g, '').slice(0, 2))}
                    maxLength={2}
                    keyboardType="number-pad"
                    style={tw`w-14 text-center h-10 bg-transparent`}
                    placeholder="MM"
                    textColor={tw.color('iosTextLight')}
                  />
                </View>
              )}
            </Surface>

            {/* Optional Note */}
            <TextInput
              label="Notes (Optional)"
              placeholder="e.g. 15 pages in morning, 15 at night"
              value={note}
              onChangeText={setNote}
              maxLength={250}
              multiline
              numberOfLines={3}
              mode="outlined"
              outlineColor={tw.color('iosBorderLight')}
              activeOutlineColor={tw.color('indigo')}
              style={tw`mb-6 bg-transparent`}
              textColor={tw.color('iosTextLight')}
            />

            {/* Actions Cancel & Save */}
            <View style={tw`flex-row justify-end mt-2`}>
              <Button
                mode="text"
                onPress={onClose}
                textColor={tw.color('iosSubtextLight')}
                style={tw`mr-2`}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                disabled={loading}
                style={tw`bg-indigo rounded-xl`}
              >
                Save
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};
