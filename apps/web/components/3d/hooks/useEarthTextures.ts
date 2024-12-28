"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { TextureLoader, Texture } from 'three';

interface TextureSet {
  dayMap: Texture | null;
  nightMap: Texture | null;
  cloudsMap: Texture | null;
  normalMap: Texture | null;
  specularMap: Texture | null;
}

const textureUrls = {
  '2k': {
    dayMap: '/textures/2k_earth_daymap.jpg',
    nightMap: '/textures/2k_earth_nightmap.jpg',
    cloudsMap: '/textures/2k_earth_clouds.jpg',
    normalMap: '/textures/2k_earth_normal_map.jpg',
    specularMap: '/textures/2k_earth_specular_map.jpg'
  },
  '8k': {
    dayMap: '/textures/8k_earth_daymap.jpg',
    nightMap: '/textures/8k_earth_nightmap.jpg',
    cloudsMap: '/textures/8k_earth_clouds.jpg',
    normalMap: '/textures/8k_earth_normal_map.jpg',
    specularMap: '/textures/8k_earth_specular_map.jpg'
  }
} as const;

// 缓存已加载的纹理
const textureCache: Record<'2k' | '8k', Partial<TextureSet>> = {
  '2k': {},
  '8k': {}
};

export function useEarthTextures() {
  const [textureSet, setTextureSet] = useState<TextureSet>({
    dayMap: null,
    nightMap: null,
    cloudsMap: null,
    normalMap: null,
    specularMap: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resolution, setResolution] = useState<'2k' | '8k'>('2k');

  const loader = useRef(new TextureLoader());
  const mountedRef = useRef(false);
  const loadingRef = useRef(false);
  const currentResolutionRef = useRef(resolution);

  // 同步更新 currentResolutionRef
  useEffect(() => {
    currentResolutionRef.current = resolution;
  }, [resolution]);

  const loadTexture = useCallback(async (key: keyof TextureSet, url: string, targetResolution: '2k' | '8k'): Promise<Texture> => {
    // 检查缓存
    if (textureCache[targetResolution][key]) {
      return textureCache[targetResolution][key] as Texture;
    }

    // 加载新纹理
    const texture = await new Promise<Texture>((resolve, reject) => {
      loader.current.load(url, resolve, undefined, reject);
    });

    // 存入缓存
    textureCache[targetResolution][key] = texture;
    return texture;
  }, []);

  const loadTextureSet = useCallback(async (targetResolution: '2k' | '8k') => {
    // 防止重复加载
    if (loadingRef.current || !mountedRef.current) return;
    if (targetResolution === currentResolutionRef.current && textureSet.dayMap) return;

    loadingRef.current = true;
    setIsLoading(true);
    setProgress(0);

    const urls = textureUrls[targetResolution];
    const total = Object.keys(urls).length;
    let loaded = 0;

    try {
      const results = await Promise.all(
        Object.entries(urls).map(async ([key, url]) => {
          const texture = await loadTexture(key as keyof TextureSet, url, targetResolution);
          loaded++;
          if (mountedRef.current) {
            setProgress(Math.round((loaded / total) * 100));
          }
          return [key, texture] as [keyof TextureSet, Texture];
        })
      );

      if (!mountedRef.current) return;

      const newTextureSet = results.reduce((acc, [key, texture]) => {
        acc[key] = texture;
        return acc;
      }, {} as TextureSet);

      setTextureSet(newTextureSet);
      setResolution(targetResolution);
    } catch (error) {
      console.error('Failed to load textures:', error);
    } finally {
      if (mountedRef.current) {
        loadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [loadTexture]);

  // 初始化
  useEffect(() => {
    mountedRef.current = true;
    loadTextureSet('2k');

    return () => {
      mountedRef.current = false;
      // 注意：不在这里清理纹理，因为它们被缓存了
    };
  }, []);

  const updateResolution = useCallback((distance: number) => {
    if (loadingRef.current) return;
    const targetResolution = distance < 3 ? '8k' : '2k';
    if (targetResolution !== currentResolutionRef.current) {
      loadTextureSet(targetResolution);
    }
  }, [loadTextureSet]);

  return {
    ...textureSet,
    isLoading,
    progress,
    currentResolution: resolution,
    updateResolution
  };
} 