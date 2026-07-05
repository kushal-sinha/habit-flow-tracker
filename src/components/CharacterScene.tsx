import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { tw } from '../utils/theme';
import { MascotIllustration } from './MascotIllustration';

interface CharacterSceneProps {
  animationName: string;
  milestoneLevel: number;
  theme: 'light' | 'dark';
}

export const CharacterScene: React.FC<CharacterSceneProps> = ({
  animationName,
  milestoneLevel,
  theme,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const timeoutRef = useRef<any>(null);

  // Path to local asset model
  const glbUrl = 'assets/mascot.glb';

  useEffect(() => {
    // Set a safety timeout: if the 3D engine fails to initialize or download CDN modules 
    // within 2.5 seconds (e.g. when offline), automatically fall back to the premium 2D illustration.
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.log('[CharacterScene] 3D load timed out (offline/CDN block). Falling back to 2D.');
        setLoading(false);
        setHasError(true);
      }
    }, 2500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading]);

  // Local HTML containing Three.js WebGL and GLTFLoader
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: transparent;
          }
          #canvas-container {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        </style>
        <!-- Load Three.js and GLTFLoader from CDNs -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" onerror="postMessageSafe({type: 'LOAD_ERROR'})"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js" onerror="postMessageSafe({type: 'LOAD_ERROR'})"></script>
      </head>
      <body>
        <div id="canvas-container"></div>
        <script>
          let scene, camera, renderer, mixer, clock, model;

          // Safe postMessage wrapper that handles late injection of the bridge
          function postMessageSafe(payload) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(payload));
            } else {
              setTimeout(() => postMessageSafe(payload), 100);
            }
          }

          function init() {
            // Verify Three is loaded
            if (typeof THREE === 'undefined') {
              postMessageSafe({ type: 'LOAD_ERROR' });
              return;
            }

            const container = document.getElementById('canvas-container');
            clock = new THREE.Clock();

            // 1. Create Scene
            scene = new THREE.Scene();

            // 2. Set Up Camera
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
            camera.position.set(0, 1.2, 3.2);

            // 3. Set Up Renderer (Transparent, Antialias)
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
            container.appendChild(renderer.domElement);

            // 4. Soft Cinematic Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, ${theme === 'dark' ? '0.4' : '0.6'});
            scene.add(ambientLight);

            const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
            keyLight.position.set(2, 4, 3);
            scene.add(keyLight);

            const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.5);
            fillLight.position.set(-2, 2, 2);
            scene.add(fillLight);

            const rimLight = new THREE.DirectionalLight(0x8b5cf6, 1.5);
            rimLight.position.set(0, 4, -4);
            scene.add(rimLight);

            // 5. Load GLB
            const loader = new THREE.GLTFLoader();
            loader.load(
              '${glbUrl}',
              (gltf) => {
                model = gltf.scene;
                scene.add(model);
                model.position.set(0, -0.3, 0);

                mixer = new THREE.AnimationMixer(model);
                const clips = gltf.animations;
                if (clips && clips.length > 0) {
                  const clip = clips.find(c => c.name.toLowerCase().includes('${animationName.toLowerCase()}')) || clips[0];
                  const action = mixer.clipAction(clip);
                  action.play();
                }

                postMessageSafe({ type: 'LOAD_SUCCESS' });
              },
              undefined,
              (error) => {
                console.error('Error loading GLB:', error);
                postMessageSafe({ type: 'LOAD_ERROR' });
              }
            );

            window.addEventListener('resize', onWindowResize);
            animate();
          }

          function onWindowResize() {
            const container = document.getElementById('canvas-container');
            const width = container.clientWidth;
            const height = container.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          }

          let angle = 0;
          function animate() {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();
            if (mixer) mixer.update(delta);

            angle += 0.005;
            camera.position.x = Math.sin(angle) * 0.08;
            camera.position.y = 1.2 + Math.cos(angle * 1.5) * 0.03;
            camera.lookAt(new THREE.Vector3(0, 1.0, 0));

            renderer.render(scene, camera);
          }

          window.onload = init;
        </script>
      </body>
    </html>
  `;

  // WebView message receiver
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
      }
    } catch {}
  };

  if (hasError) {
    // Auto fallback to high-fidelity vector illustration
    return <MascotIllustration milestoneLevel={milestoneLevel} />;
  }

  return (
    <View style={tw`w-full h-full relative`}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        scrollEnabled={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        allowFileAccess
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
