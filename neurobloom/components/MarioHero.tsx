"use client";
import React, { useRef } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { Float, PerspectiveCamera, Edges, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// FIX: Use a 'type' alias with an intersection (&) instead of an interface
type BoxProps = ThreeElements['mesh'] & {
  color?: string;
};

function Box({ color = '#FBD000', ...props }: BoxProps) {
  const ref = useRef<THREE.Mesh>(null!);
  
  useFrame((_, delta) => {
    ref.current.rotation.x += delta * 0.5;
    ref.current.rotation.y += delta * 0.2;
  });
  
  return (
    <mesh {...props} ref={ref} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
      <Edges linewidth={2} threshold={15} color="black" />
    </mesh>
  );
}

function Coin(props: ThreeElements['mesh']) {
  const ref = useRef<THREE.Mesh>(null!);
  
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 2;
  });
  
  return (
    <mesh {...props} ref={ref} castShadow>
      <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
      <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
    </mesh>
  );
}

function Cloud({ className }: { className?: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="w-12 h-12 bg-white rounded-full absolute bottom-0 left-0" />
      <div className="w-16 h-16 bg-white rounded-full absolute bottom-0 left-6" />
      <div className="w-12 h-12 bg-white rounded-full absolute bottom-0 left-16" />
      <div className="w-24 h-8 bg-white rounded-full absolute bottom-0 left-2" />
    </div>
  );
}

export function MarioHero() {
  return (
    <div className="w-full h-[500px] relative bg-[#5C94FC] overflow-hidden rounded-3xl border-4 border-black shadow-lg">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        <Environment preset="city" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Box position={[-2, 1, 0]} color="#E52521" />
          <Box position={[0, 1.5, -1]} color="#FBD000" />
          <Box position={[2, 0.5, 0]} color="#43B047" />
          
          <Coin position={[-1.5, -1, 1]} />
          <Coin position={[1.5, -0.5, 1]} />
          <Coin position={[0, -1.5, 0.5]} />
        </Float>

        <ContactShadows position={[0, -2.5, 0]} opacity={0.6} scale={15} blur={2} far={4} />
      </Canvas>
      
      <Cloud className="top-12 left-10 scale-100 opacity-90" />
      <Cloud className="top-24 right-24 scale-125 opacity-70" />
      <Cloud className="bottom-16 left-1/4 scale-75 opacity-80" />
    </div>
  );
}