import React from 'react';
import { View } from 'react-native';
import Svg, { 
  Circle, 
  Path, 
  Rect, 
  Defs, 
  LinearGradient, 
  Stop, 
  G 
} from 'react-native-svg';
import { tw } from '../utils/theme';

interface MascotIllustrationProps {
  milestoneLevel?: number;
  pose?: 'idle' | 'cheer' | 'trophy' | 'avatar' | 'sad';
  width?: number;
  height?: number;
}

export const MascotIllustration: React.FC<MascotIllustrationProps> = ({ 
  milestoneLevel = 0, 
  pose,
  width = 250,
  height = 250 
}) => {
  // Determine pose based on explicit prop or milestone level fallback
  const resolvedPose = pose || (milestoneLevel >= 14 ? 'trophy' : 'cheer');

  // If we are showing only the head avatar, adjust the viewBox to zoom in on the face
  const viewBox = resolvedPose === 'avatar' ? '65 22 70 70' : '0 0 200 200';

  return (
    <View style={tw`items-center justify-center`}>
      <Svg width={width} height={height} viewBox={viewBox} fill="none">
        <Defs>
          {/* Background Glow */}
          <LinearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.15} />
            <Stop offset="100%" stopColor="#EC4899" stopOpacity={0.02} />
          </LinearGradient>
          {/* Hair Gradient */}
          <LinearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#4A3B32" />
            <Stop offset="100%" stopColor="#2A1F1A" />
          </LinearGradient>
          {/* Face Skin Gradient */}
          <LinearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFDFC4" />
            <Stop offset="100%" stopColor="#FCD5B5" />
          </LinearGradient>
          {/* Hoodie Purple Gradient */}
          <LinearGradient id="hoodieGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#7C3AED" />
            <Stop offset="100%" stopColor="#5B21B6" />
          </LinearGradient>
          {/* Gold Trophy Gradient */}
          <LinearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="50%" stopColor="#EAB308" />
            <Stop offset="100%" stopColor="#CA8A04" />
          </LinearGradient>
        </Defs>

        {/* 1. Backdrop Glow Ring (Hide on pure avatar view) */}
        {resolvedPose !== 'avatar' && (
          <>
            <Circle cx="100" cy="100" r="85" fill="url(#glowGrad)" />
            <Circle cx="100" cy="100" r="70" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.3" />
          </>
        )}

        <G id="mascot-character" transform={resolvedPose === 'avatar' ? 'translate(0, 0)' : 'translate(0, 10)'}>
          {/* 2. Hoodie Body (Omit on avatar headshot view) */}
          {resolvedPose !== 'avatar' && (
            <>
              <Path 
                d="M60,150 C60,115 80,105 100,105 C120,105 140,115 140,150 L135,180 L65,180 Z" 
                fill="url(#hoodieGrad)" 
              />
              {/* Hoodie Hood fold shadow */}
              <Path 
                d="M72,110 C85,96 115,96 128,110 C120,115 80,115 72,110 Z" 
                fill="#4C1D95" 
                opacity="0.5"
              />
            </>
          )}

          {/* 3. Neck */}
          {resolvedPose !== 'avatar' && (
            <Rect x="92" y="85" width="16" height="22" rx="4" fill="url(#skinGrad)" />
          )}

          {/* 4. Head (Stylized rounded form) */}
          <Circle cx="100" cy="70" r="32" fill="url(#skinGrad)" />
          
          {/* Blushing Cheeks */}
          <Circle cx="78" cy="78" r="6" fill="#F87171" opacity="0.4" />
          <Circle cx="122" cy="78" r="6" fill="#F87171" opacity="0.4" />

          {/* 5. Expressive Hair */}
          <Path 
            d="M66,62 C62,45 80,30 92,34 C94,22 110,18 120,28 C128,24 138,36 134,48 C140,54 136,66 132,68 C122,54 78,54 66,62 Z" 
            fill="url(#hairGrad)" 
          />
          {/* Front Hair Fringe */}
          <Path 
            d="M80,48 C85,44 95,44 98,48 C102,44 112,44 116,48 C122,53 118,58 112,56 C105,54 102,58 98,54 C92,58 84,54 80,48 Z" 
            fill="#2A1F1A" 
          />

          {/* 6. Eyes based on Pose */}
          {resolvedPose === 'sad' ? (
            <>
              {/* Drooped Sad Eyes (Arcs curving down u u) */}
              <Path d="M78,72 Q84,79 90,72" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <Path d="M110,72 Q116,79 122,72" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              {/* Closed Happy Eyes (Arcs curving up ^ ^) */}
              <Path d="M78,70 Q84,63 90,70" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <Path d="M110,70 Q116,63 122,70" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* 7. Smile or Frown based on Pose */}
          {resolvedPose === 'sad' ? (
            /* Frown */
            <Path d="M93,84 Q100,77 107,84" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : (
            /* Happy Smile */
            <Path d="M93,80 Q100,88 107,80" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}
          
          {/* 8. Hoodie Drawstrings */}
          {resolvedPose !== 'avatar' && (
            <>
              <Path d="M94,115 L92,135" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <Path d="M106,115 L108,132" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <Circle cx="92" cy="136" r="2.5" fill="#E2E8F0" />
              <Circle cx="108" cy="133" r="2.5" fill="#E2E8F0" />
            </>
          )}

          {/* 9. Arms & Poses */}
          {resolvedPose === 'cheer' && (
            /* Celebrating Arms (Raised up V-pose) */
            <G id="arms-celebrating">
              <Path d="M66,122 C50,105 40,85 46,75 C52,65 62,85 70,110 Z" fill="url(#hoodieGrad)" />
              <Circle cx="44" cy="72" r="7" fill="url(#skinGrad)" />
              <Path d="M134,122 C150,105 160,85 154,75 C148,65 138,85 130,110 Z" fill="url(#hoodieGrad)" />
              <Circle cx="156" cy="72" r="7" fill="url(#skinGrad)" />
            </G>
          )}

          {resolvedPose === 'trophy' && (
            /* Holding Gold Trophy Pose */
            <G id="arms-trophy">
              <Path d="M66,125 C62,135 78,145 84,135 Z" fill="url(#hoodieGrad)" />
              <Circle cx="84" cy="133" r="6" fill="url(#skinGrad)" />
              <Path d="M134,125 C138,135 122,145 116,135 Z" fill="url(#hoodieGrad)" />
              <Circle cx="116" cy="133" r="6" fill="url(#skinGrad)" />

              {/* The Gold Trophy */}
              <G id="gold-trophy" transform="translate(82, 108)">
                <Path d="M6,0 L30,0 C30,0 36,15 30,22 C24,28 12,28 6,22 C0,15 6,0 6,0 Z" fill="url(#goldGrad)" />
                <Path d="M6,6 C0,6 0,16 6,16" stroke="#CA8A04" strokeWidth="2.5" fill="none" />
                <Path d="M30,6 C36,6 36,16 30,16" stroke="#CA8A04" strokeWidth="2.5" fill="none" />
                <Rect x="16" y="24" width="4" height="6" fill="#CA8A04" />
                <Rect x="12" y="29" width="12" height="4" rx="1" fill="#854D0E" />
                <Path d="M18,6 L19,9 L22,9 L19.5,11 L20.5,14 L18,12 L15.5,14 L16.5,11 L14,9 L17,9 Z" fill="#FFFFFF" />
              </G>
            </G>
          )}

          {(resolvedPose === 'idle' || resolvedPose === 'sad') && (
            /* Idle Hands on Hips Pose */
            <G id="arms-idle">
              <Path d="M64,120 C54,128 46,140 50,146 C54,152 64,142 68,130 Z" fill="url(#hoodieGrad)" />
              <Circle cx="50" cy="146" r="6" fill="url(#skinGrad)" />
              <Path d="M136,120 C146,128 154,140 150,146 C146,152 136,142 132,130 Z" fill="url(#hoodieGrad)" />
              <Circle cx="150" cy="146" r="6" fill="url(#skinGrad)" />
            </G>
          )}
        </G>
      </Svg>
    </View>
  );
};
