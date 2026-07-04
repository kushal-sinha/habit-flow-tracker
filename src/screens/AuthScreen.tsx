import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, Surface } from 'react-native-paper';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { tw } from '../utils/theme';

interface AuthScreenProps {
  onContinueAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onContinueAsGuest }) => {
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

  const [isSignInMode, setIsSignInMode] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  
  // For verification step after signing up
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(false);

  // Sign In action
  const onSignInPress = async () => {
    if (!signInLoaded) return;
    
    const email = emailAddress.trim();
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: email,
        password,
      });
      
      if (completeSignIn.status === 'complete') {
        await setSignInActive({ session: completeSignIn.createdSessionId });
      } else {
        console.warn('Sign in status incomplete:', completeSignIn);
        Alert.alert('Authentication Error', 'Verification is required to complete sign-in.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Sign in failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up action
  const onSignUpPress = async () => {
    if (!signUpLoaded) return;

    const email = emailAddress.trim();
    const name = firstName.trim();
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  // Email Code Verification action
  const onPressVerify = async () => {
    if (!signUpLoaded) return;

    if (!code) {
      Alert.alert('Error', 'Please enter verification code');
      return;
    }

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
      } else {
        Alert.alert('Verification Failed', 'Verification status incomplete.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Verification code is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-iosBgLight dark:bg-iosBgDark`}
    >
      <ScrollView contentContainerStyle={tw`flex-grow justify-center px-6 py-12`}>
        {/* Brand Header */}
        <View style={tw`items-center mb-8`}>
          <Text style={tw`text-5xl mb-2 font-light text-indigo`}>🌱</Text>
          <Text style={[tw`text-3xl font-extrabold tracking-tight text-center text-iosTextLight dark:text-iosTextDark`, { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-thin' }]}>
            HabitFlow
          </Text>
          <Text style={tw`text-sm text-iosSubtextLight dark:text-iosSubtextDark text-center mt-2 px-6`}>
            Build consistent routines, unlock streaks, and elevate your focus daily.
          </Text>
        </View>

        <Surface style={tw`p-6 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark shadow-sm elevation-1`}>
          {loading && (
            <ActivityIndicator animating={true} color={tw.color('indigo')} style={tw`mb-4`} />
          )}

          {!pendingVerification ? (
            <View>
              <Text style={tw`text-xl font-semibold mb-6 text-iosTextLight dark:text-iosTextDark`}>
                {isSignInMode ? 'Welcome back' : 'Create account'}
              </Text>

              {!isSignInMode && (
                <TextInput
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  mode="outlined"
                  outlineColor={tw.color('iosBorderLight')}
                  activeOutlineColor={tw.color('indigo')}
                  style={tw`mb-4 bg-transparent`}
                  textColor={tw.color('iosTextLight')}
                />
              )}

              <TextInput
                label="Email Address"
                value={emailAddress}
                onChangeText={setEmailAddress}
                autoCapitalize="none"
                keyboardType="email-address"
                mode="outlined"
                outlineColor={tw.color('iosBorderLight')}
                activeOutlineColor={tw.color('indigo')}
                style={tw`mb-4 bg-transparent`}
                textColor={tw.color('iosTextLight')}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                outlineColor={tw.color('iosBorderLight')}
                activeOutlineColor={tw.color('indigo')}
                style={tw`mb-6 bg-transparent`}
                textColor={tw.color('iosTextLight')}
              />

              <Button
                mode="contained"
                onPress={isSignInMode ? onSignInPress : onSignUpPress}
                disabled={loading}
                contentStyle={tw`py-1.5`}
                style={tw`rounded-xl bg-indigo mb-4`}
              >
                {isSignInMode ? 'Sign In' : 'Sign Up'}
              </Button>

              <TouchableOpacity 
                onPress={() => setIsSignInMode(!isSignInMode)}
                style={tw`items-center py-2`}
              >
                <Text style={tw`text-indigo font-medium text-sm`}>
                  {isSignInMode ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={tw`text-xl font-semibold mb-2 text-iosTextLight dark:text-iosTextDark`}>
                Verify your email
              </Text>
              <Text style={tw`text-sm text-iosSubtextLight dark:text-iosSubtextDark mb-6`}>
                We sent a 6-digit verification code to {emailAddress}. Please enter it below.
              </Text>

              <TextInput
                label="Verification Code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                mode="outlined"
                outlineColor={tw.color('iosBorderLight')}
                activeOutlineColor={tw.color('indigo')}
                style={tw`mb-6 bg-transparent`}
                textColor={tw.color('iosTextLight')}
              />

              <Button
                mode="contained"
                onPress={onPressVerify}
                disabled={loading}
                contentStyle={tw`py-1.5`}
                style={tw`rounded-xl bg-indigo mb-4`}
              >
                Verify Code
              </Button>

              <TouchableOpacity 
                onPress={() => setPendingVerification(false)}
                style={tw`items-center py-2`}
              >
                <Text style={tw`text-indigo font-medium text-sm`}>
                  Go Back
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Surface>

        {/* Offline Guest Mode Action */}
        <TouchableOpacity
          onPress={onContinueAsGuest}
          style={tw`mt-8 self-center py-3 px-6 rounded-2xl border border-iosBorderLight dark:border-iosBorderDark bg-iosCardLight dark:bg-iosCardDark items-center shadow-sm flex-row justify-center`}
        >
          <Text style={tw`text-iosSubtextLight dark:text-iosSubtextDark font-semibold mr-1.5`}>👤</Text>
          <Text style={tw`text-iosTextLight dark:text-iosTextDark font-semibold text-sm`}>
            Continue Offline (Guest Mode)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
