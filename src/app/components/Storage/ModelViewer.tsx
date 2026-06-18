import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center, Html, useProgress } from '@react-three/drei';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCubes } from '@fortawesome/free-solid-svg-icons';
import s from './ModelViewer.module.css';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className={s.loaderHtml}>
        <div className={s.loaderRing} />
        <span className={s.loaderText}>{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}

function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

function getExtension(url: string): string {
  return url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
}

interface ModelViewerProps {
  url: string;
}

export function ModelViewer({ url }: ModelViewerProps) {
  const ext = getExtension(url);
  const isGltf = ext === 'glb' || ext === 'gltf';
  const controlsRef = useRef(null);

  if (!isGltf) {
    return (
      <div className={s.unsupported}>
        <FontAwesomeIcon icon={faCubes} className={s.unsupportedIcon} />
        <p className={s.unsupportedText}>
          .{ext || '?'} format preview not available
        </p>
        <p className={s.unsupportedHint}>Download the file to view it locally</p>
      </div>
    );
  }

  return (
    <div className={s.canvasWrapper}>
      <Canvas
        camera={{ fov: 45, position: [0, 1.5, 6.5] }}
        gl={{ antialias: true }}
        shadows
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />

        <Suspense fallback={<Loader />}>
          <GltfModel url={url} />
          <Environment preset="warehouse" blur={0.85} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          autoRotate
          autoRotateSpeed={1.2}
          enableZoom
          enablePan={false}
          minDistance={0.5}
          maxDistance={20}
        />
      </Canvas>

      <div className={s.hint}>Drag to rotate · Scroll to zoom</div>
    </div>
  );
}
