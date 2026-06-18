import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Center, Environment } from '@react-three/drei';

function getExt(url: string) {
  return url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
}

function StaticModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  return (
    <Center>
      <primitive object={cloned} />
    </Center>
  );
}

interface ModelThumbnailProps {
  url: string;
}

export function ModelThumbnail({ url }: ModelThumbnailProps) {
  const ext = getExt(url);
  const isGltf = ext === 'glb' || ext === 'gltf';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isGltf) return;
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setMounted(true); observer.disconnect(); } },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isGltf]);

  if (!isGltf) return null;

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      {mounted && (
        <Canvas
          camera={{ fov: 42, position: [0, 1, 6.5] }}
          gl={{ antialias: true }}
          dpr={[1, 1.5]}
          frameloop="demand"
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 3]} intensity={1.1} />
          <Suspense fallback={null}>
            <StaticModel url={url} />
            <Environment preset="warehouse" blur={0.85} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
