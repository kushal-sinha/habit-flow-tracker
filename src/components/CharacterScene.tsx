import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { tw } from '../utils/theme';
import { Asset } from 'expo-asset';
import { MascotIllustration } from './MascotIllustration';

const modelMeshy = require('../../assets/models/Meshy.glb');
const modelCrimson = require('../../assets/models/crimson.glb');

interface CharacterSceneProps {
  animationName: string;
  milestoneLevel: number;
  theme: 'light' | 'dark';
  modelType?: 'meshy' | 'crimson';
}

export const CharacterScene: React.FC<CharacterSceneProps> = ({
  animationName,
  milestoneLevel,
  theme,
  modelType = 'meshy',
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const timeoutRef = useRef<any>(null);

  // Resolve the static HTML asset served from Metro
  useEffect(() => {
    async function resolveAsset() {
      try {
        // Resolve HTML container
        const htmlAsset = Asset.fromModule(require('../../assets/character_scene.html'));
        await htmlAsset.downloadAsync();
        
        // Resolve GLB model dynamically based on prop
        const modelModule = modelType === 'crimson' ? modelCrimson : modelMeshy;
        const glbAsset = Asset.fromModule(modelModule);
        await glbAsset.downloadAsync();
        
        // Target URI with query parameters for animation, theme, and absolute model path
        const baseUri = htmlAsset.localUri || htmlAsset.uri;
        const modelUri = glbAsset.localUri || glbAsset.uri;
        const targetUrl = `${baseUri}?animation=${encodeURIComponent(animationName)}&theme=${encodeURIComponent(theme)}&modelUrl=${encodeURIComponent(modelUri)}`;
        
        setResolvedUrl(targetUrl);
      } catch (err) {
        console.error('[CharacterScene] Failed to resolve assets:', err);
        setHasError(true);
      }
    }
    resolveAsset();
  }, [animationName, theme, modelType]);

  useEffect(() => {
    // Timeout backup: if loading takes longer than 2.8 seconds, fallback to 2D
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.log('[CharacterScene] 3D load timed out. Falling back to 2D.');
        setLoading(false);
        setHasError(true);
      }
    }, 2800);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOAD_SUCCESS') {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setLoading(false);
      } else if (data.type === 'LOAD_ERROR') {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setLoading(false);
        setHasError(true);
      } else if (data.type === 'CONSOLE_ERROR') {
        console.warn('[WebView Console Error]:', data.data);
      } else if (data.type === 'WEBVIEW_ERROR') {
        console.warn('[WebView Runtime Error]:', data.message, 'at', data.source, 'line', data.lineno);
      }
    } catch {}
  };

  if (hasError) {
    return <MascotIllustration milestoneLevel={milestoneLevel} />;
  }

  if (!resolvedUrl) {
    return (
      <View style={tw`w-full h-full items-center justify-center bg-transparent`}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={tw`w-full h-full relative`}>
      <WebView
        originWhitelist={['*']}
        source={{ uri: resolvedUrl }}
        style={styles.webView}
        scrollEnabled={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        allowFileAccessFromFileURLs
        onMessage={handleMessage}
        onError={() => setHasError(true)}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, tw`items-center justify-center bg-transparent`]}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  webView: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
