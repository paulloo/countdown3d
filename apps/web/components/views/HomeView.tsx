"use client";

import { Box, RotateCw, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Canvas } from "@react-three/fiber";
import { Earth, EarthRef } from "@/components/3d/Earth";
import { Suspense, useState, useRef } from "react";
import { LoadingSpinner } from "@/components/3d/LoadingSpinner";
import { OrbitControls } from "@react-three/drei";
import { useClickEffect } from "@/hooks/useClickEffect";
import { toast } from "sonner";

export function HomeView() {
  const { clickEffects, recordCurrentLocation, isConnected, userLocation, isTestEnv } = useClickEffect();
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const earthRef = useRef<EarthRef>(null);
  const controlsRef = useRef(null);

  const handleRecordClick = async () => {
    if (!isConnected) {
      toast.error("WebSocket 未连接，正在尝试重新连接...");
      return;
    }

    setIsLoading(true);
    try {
      const newLocation = await recordCurrentLocation();
      
      // 等待位置更新完成后再进行定位
      setTimeout(() => {
        if (earthRef.current && userLocation) {
          earthRef.current.focusPosition(userLocation.lat, userLocation.lng);
          toast.success("位置已成功记录并定位！");
        }
      }, 100);
      
    } catch (error) {
      console.error("记录位置失败:", error);
      toast.error(error instanceof Error ? error.message : "记录位置失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoRotate = () => {
    setIsAutoRotate(!isAutoRotate);
    toast.success(isAutoRotate ? "已停止自动旋转" : "已开启自动旋转");
  };

  const handleReset = () => {
    if (earthRef.current) {
      earthRef.current.resetPosition();
      toast.success("已重置地球位置");
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-black to-blue-950">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="text-sm text-white bg-black/50 px-2 py-1 rounded">
          {isTestEnv ? "测试环境" : "生产环境"}
        </div>
        <div className={`text-sm text-white ${isConnected ? 'bg-green-500/50' : 'bg-red-500/50'} px-2 py-1 rounded`}>
          {isConnected ? "已连接" : "未连接"}
        </div>
        {userLocation && (
          <div className="text-sm text-white bg-black/50 px-2 py-1 rounded">
            经度: {userLocation.lng.toFixed(6)}<br />
            纬度: {userLocation.lat.toFixed(6)}
          </div>
        )}
        <Button
          variant="default"
          onClick={handleRecordClick}
          disabled={isLoading}
          className="relative"
        >
          <Box className="mr-2 h-4 w-4" />
          {isLoading ? "记录中..." : (isTestEnv ? "记录随机位置" : "记录位置")}
          {!isConnected && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
              等待连接...
            </div>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={toggleAutoRotate}
          className="bg-black/50 hover:bg-black/70"
        >
          {isAutoRotate ? (
            <>
              <RotateCw className="mr-2 h-4 w-4" />
              停止旋转
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              开始旋转
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          className="bg-black/50 hover:bg-black/70"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          重置位置
        </Button>
      </div>

      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 3, 10]} />
        
        <Suspense fallback={<LoadingSpinner />}>
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={5}
            rotateSpeed={0.5}
            autoRotate={isAutoRotate}
            autoRotateSpeed={0.5}
            enableDamping={true}
            dampingFactor={0.05}
          />
          <Earth 
            ref={earthRef}
            positions={clickEffects} 
            userLocation={userLocation} 
            autoRotate={isAutoRotate}
            controlsRef={controlsRef}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}