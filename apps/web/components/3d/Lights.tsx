"use client";

export function Lights() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ff0000" />
      <pointLight position={[5, -5, 5]} intensity={0.5} color="#0000ff" />
    </>
  );
}