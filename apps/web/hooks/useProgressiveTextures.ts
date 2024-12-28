"use client";

import { useState, useEffect } from "react";
import { TextureLoader } from "three";
import { useThree } from "@react-three/fiber";

interface TextureSet {
  dayMap: THREE.Texture | null;
  nightMap: THREE.Texture | null;
  normalMap: THREE.Texture | null;
  specularMap: THREE.Texture | null;
  cloudsMap: THREE.Texture | null;
}

export function useProgressiveTextures() {
  const [textures, setTextures] = useState<TextureSet>({
    dayMap: null,
    nightMap: null,
    normalMap: null,
    specularMap: null,
    cloudsMap: null,
  });
  const [isHighRes, setIsHighRes] = useState(false);
  const { camera } = useThree();

  useEffect(() => {
    const loader = new TextureLoader();
    
    // 首先加载2K纹理
    Promise.all([
      loader.loadAsync("/textures/2k_earth_daymap.jpg"),
      loader.loadAsync("/textures/2k_earth_nightmap.jpg"),
      loader.loadAsync("/textures/2k_earth_normal_map.jpg"),
      loader.loadAsync("/textures/2k_earth_specular_map.jpg"),
      loader.loadAsync("/textures/2k_earth_clouds.jpg"),
    ]).then(([dayMap, nightMap, normalMap, specularMap, cloudsMap]) => {
      setTextures({ dayMap, nightMap, normalMap, specularMap, cloudsMap });
    });

    // 监听相机距离，决定是否加载8K纹理
    const handleCameraChange = () => {
      const distance = camera.position.length();
      if (distance < 4 && !isHighRes) {
        setIsHighRes(true);
        // 加载8K纹理
        Promise.all([
          loader.loadAsync("/textures/8k_earth_daymap.jpg"),
          loader.loadAsync("/textures/8k_earth_nightmap.jpg"),
          loader.loadAsync("/textures/8k_earth_normal_map.jpg"),
          loader.loadAsync("/textures/8k_earth_specular_map.jpg"),
          loader.loadAsync("/textures/8k_earth_clouds.jpg"),
        ]).then(([dayMap, nightMap, normalMap, specularMap, cloudsMap]) => {
          setTextures({ dayMap, nightMap, normalMap, specularMap, cloudsMap });
        });
      }
    };

    // 添加相机变化监听
    camera.addEventListener("change", handleCameraChange);

    return () => {
      camera.removeEventListener("change", handleCameraChange);
    };
  }, [camera, isHighRes]);

  return textures;
} 