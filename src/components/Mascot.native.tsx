// @ts-nocheck
import React, { Suspense, useEffect, useRef, useState, useMemo, createContext, useContext } from "react";
import { View, StyleSheet, AccessibilityInfo, Modal, Text, TouchableOpacity } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { useGLTF, useAnimations } from "@react-three/drei/native";
import { Asset } from "expo-asset";
import * as THREE from "three";

/**
 * Mascot animation system — React Native / Expo build
 * -----------------------------------------------------
 * Place your finished GLB at: assets/models/Meshy.glb
 */

const CLIP_NAMES = {
  idle: "Idle",
  breathing: "Breathing",
  smile: "Smile",
  blink: "Blink",
  wave: "Wave",
  happyJump: "HappyJump",
  doubleFistPump: "DoubleFistPump",
  dance: "Dance",
  trophyLift: "TrophyLift",
  victoryPose: "VictoryPose",
  highFive: "HighFive",
  confetti: "ConfettiCelebration",
  heart: "HeartGesture",
  spin: "Spin",
  cheer: "Cheer",
  lookingAround: "LookingAround",
};

const DEFAULT_FADE = 0.35;

const MASCOT_ASSET = require("../../assets/models/Meshy.glb");

// ---------------------------------------------------------------------------
// Theme context
// ---------------------------------------------------------------------------
const MascotThemeContext = createContext({ theme: "dark" });

export function MascotThemeProvider({ theme = "dark", children }: { theme?: string; children: React.ReactNode }) {
  return (
    <MascotThemeContext.Provider value={{ theme }}>
      {children}
    </MascotThemeContext.Provider>
  );
}

function useMascotTheme() {
  return useContext(MascotThemeContext).theme;
}

// ---------------------------------------------------------------------------
// Core mascot mesh + animation controller
// ---------------------------------------------------------------------------
interface MascotModelProps {
  assetModule: any;
  activeClip: string;
  onClipFinished?: (clip: string) => void;
  loop?: boolean;
  speed?: number;
}

function MascotModel({ assetModule, activeClip, onClipFinished, loop = false, speed = 1 }: MascotModelProps) {
  const group = useRef<THREE.Group>(null);
  
  // Cast useGLTF to any to prevent generic array union resolution errors in TS
  const { scene, animations } = useGLTF(assetModule) as any;
  const { actions, mixer } = useAnimations(animations, group);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const clipKey = (CLIP_NAMES as any)[activeClip] || activeClip;
    const nextAction = actions[clipKey];
    if (!nextAction) {
      console.warn(`[Mascot] No animation clip found for "${clipKey}". Available:`, Object.keys(actions));
      return;
    }

    const prevAction = currentActionRef.current;

    nextAction.reset();
    nextAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    nextAction.clampWhenFinished = !loop;
    nextAction.timeScale = speed;

    if (prevAction && prevAction !== nextAction) {
      nextAction.play();
      prevAction.crossFadeTo(nextAction, DEFAULT_FADE, true);
    } else {
      nextAction.play();
    }

    currentActionRef.current = nextAction;

    const handleFinished = (e: any) => {
      if (e.action === nextAction && !loop) {
        onClipFinished?.(activeClip);
      }
    };
    mixer.addEventListener("finished", handleFinished);
    return () => mixer.removeEventListener("finished", handleFinished);
  }, [activeClip, actions, mixer, loop, speed, onClipFinished]);

  return <primitive ref={group} object={clonedScene} dispose={null} />;
}

// ---------------------------------------------------------------------------
// Theme-aware lighting rig
// ---------------------------------------------------------------------------
function MascotLighting() {
  const theme = useMascotTheme();

  if (theme === "light") {
    return (
      <>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.35} />
      <spotLight position={[2, 4, 3]} angle={0.5} penumbra={0.9} intensity={1.4} />
      <pointLight position={[-3, 1, -2]} intensity={0.25} color="#7c5cff" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Idle sway
// ---------------------------------------------------------------------------
function IdleSway({ children, enabled = true }: { children: React.ReactNode; enabled?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduceMotion);
    return () => {
      if (sub && (sub as any).remove) {
        (sub as any).remove();
      }
    };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current || !enabled || reduceMotion) return;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.05;
  });

  return <group ref={ref}>{children}</group>;
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------
interface MascotProps {
  clip?: string;
  loop?: boolean;
  speed?: number;
  theme?: string;
  onClipFinished?: (clip: string) => void;
  height?: number;
}

export default function Mascot({
  clip = "idle",
  loop = clip === "idle" || clip === "breathing",
  speed = 1,
  theme,
  onClipFinished,
  height = 280,
}: MascotProps) {
  const contextTheme = useMascotTheme();
  const resolvedTheme = theme || contextTheme;

  return (
    <View style={[styles.container, { height }]}>
      <Canvas camera={{ position: [0, 1.4, 3.2], fov: 35 }}>
        <MascotThemeProvider theme={resolvedTheme}>
          <MascotLighting />
          <Suspense fallback={null}>
            <IdleSway enabled={clip === "idle"}>
              <MascotModel
                assetModule={MASCOT_ASSET}
                activeClip={clip}
                loop={loop}
                speed={speed}
                onClipFinished={onClipFinished}
              />
            </IdleSway>
          </Suspense>
        </MascotThemeProvider>
      </Canvas>
    </View>
  );
}

// Preload
export async function preloadMascot() {
  await Asset.loadAsync(MASCOT_ASSET);
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});

// ---------------------------------------------------------------------------
// Example: streak celebration modal wiring
// ---------------------------------------------------------------------------
interface StreakCelebrationExampleProps {
  visible: boolean;
  streakDays?: number;
  onClose?: () => void;
  onContinue?: () => void;
}

export function StreakCelebrationExample({
  visible,
  streakDays = 17,
  onClose,
  onContinue,
}: StreakCelebrationExampleProps) {
  const [clip, setClip] = useState("happyJump");

  useEffect(() => {
    if (!visible) return;
    setClip("happyJump");
    const t = setTimeout(() => setClip("idle"), 1800);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.card}>
          <Mascot
            clip={clip}
            loop={clip === "idle"}
            onClipFinished={(finished) => {
              if (finished === "happyJump") setClip("idle");
            }}
            height={280}
            theme="dark"
          />
          <Text style={modalStyles.title}>🎉 WOOHOO!</Text>
          <Text style={modalStyles.subtitle}>You did it!</Text>
          <Text style={modalStyles.streak}>{streakDays} Day Streak</Text>
          <Text style={modalStyles.body}>Keep going, you're doing amazing!</Text>
          <TouchableOpacity style={modalStyles.button} onPress={onContinue}>
            <Text style={modalStyles.buttonText}>Let's Go! 🔥</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "88%",
    borderRadius: 20,
    backgroundColor: "#15131f",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#fff", marginTop: 8 },
  subtitle: { fontSize: 14, color: "#c9c6d6", marginTop: 4 },
  streak: { fontSize: 26, fontWeight: "800", color: "#a78bfa", marginTop: 8 },
  body: { fontSize: 13, color: "#c9c6d6", marginTop: 4, textAlign: "center" },
  button: {
    marginTop: 20,
    backgroundColor: "#7c5cff",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
