import s from './InspectorViewport.module.css';
import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, Environment, Html, OrbitControls, useAnimations, useGLTF, useProgress } from '@react-three/drei';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import type { AnimationClip, Group, Material, Object3D } from 'three';

export interface LoadedModel { scene: Object3D; animations: AnimationClip[] }

interface Props {
  url: string;
  wireframe: boolean;
  // The animation playing; none if null.
  animation: string | null;
  // Once the model is loaded: what's measured of it.
  onLoaded: (model: LoadedModel) => void;
}

// The model downloading: the same spinner as before it, with how much has come.
function Progress() {
  const { progress } = useProgress();
  return (
    <Html center>
      <span className={s.progress}><FontAwesomeIcon icon={faSpinner} spin className={s.spinner} />{Math.round(progress)}%</span>
    </Html>
  );
}

function Model({ url, wireframe, animation, onLoaded }: Props) {
  const gltf = useGLTF(url);
  const root = useRef<Group>(null);
  const { actions } = useAnimations(gltf.animations, root);

  useEffect(() => { onLoaded({ scene: gltf.scene, animations: gltf.animations }); }, [gltf, onLoaded]);

  useEffect(() => {
    gltf.scene.traverse(object => {
      const material = (object as Object3D & { material?: Material | Material[] }).material;
      for (const m of Array.isArray(material) ? material : material ? [material] : []) {
        (m as Material & { wireframe?: boolean }).wireframe = wireframe;
      }
    });
  }, [gltf, wireframe]);

  useEffect(() => {
    const action = animation ? actions[animation] : null;
    action?.reset().fadeIn(0.2).play();
    return () => { action?.fadeOut(0.2); };
  }, [actions, animation]);

  return (
    <group ref={root}>
      <Center><primitive object={gltf.scene} /></Center>
    </group>
  );
}

// The model, to orbit around: in wireframe or not, with one of its animations playing.
export function InspectorViewport(props: Props) {
  return (
    <div className={s.viewport} data-testid="inspector-viewport">
      <Canvas camera={{ fov: 45, position: [0, 1.5, 6] }} gl={{ antialias: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />
        <Suspense fallback={<Progress />}>
          <Model {...props} />
          <Environment preset="warehouse" blur={0.85} />
        </Suspense>
        <OrbitControls enableZoom minDistance={0.3} maxDistance={50} />
      </Canvas>
    </div>
  );
}
