import { GestureRecognizer, PoseLandmarker } from "@mediapipe/tasks-vision";
import { useEffect, useRef } from "react"
import { setupGestureRecognizer, setupPoseLandmarker } from "./modelSettings";
import { useStream } from "./useStream";

interface MediapipeProps {
  nextSlide: () => void;
  prevSlide: () => void;
}

export const Mediapipe = ({nextSlide, prevSlide}: MediapipeProps) => {
  const [canvasWidth, canvasHeight] = [480, 360];
  const oneSecMs = 1000; // 1秒のミリ秒換算

  const inputVideo = useRef<HTMLVideoElement>(null);
  const outputVideo = useRef<HTMLCanvasElement>(null);
  useStream(inputVideo, canvasWidth, canvasHeight);
  

  useEffect(() => {
    const video = inputVideo.current;
    let lastVideoTime = -1;
    let poseLandmarker: PoseLandmarker | null = null;
    let gestureRecognizer: GestureRecognizer | null = null;

    const makeTasks = async () => {
      poseLandmarker = await setupPoseLandmarker(); // from ./modelSettings.ts 全身座標のモデル
      gestureRecognizer = await setupGestureRecognizer(); // from ./modelSettings.ts ジェスチャー認識のモデル
    
      let countOpen = 0;
      let countPointer = 0;
      const renderLoop = () => {
        if(video && video.currentTime !== lastVideoTime) {
          try {
            const time = video.currentTime * oneSecMs;
            const poseResult = poseLandmarker!.detectForVideo(video, time);
            const gestureResult = gestureRecognizer!.recognizeForVideo(video, time);
            const gestureLeft = gestureResult.gestures.at(0)?.at(0);

            // リファクタリング必要。オブジェクト使って、ジェスチャーが増えてもコードがそこまで増えないようにしたい。
            if(gestureLeft?.categoryName === "Open_Palm") {
              countOpen++;
            } else if (gestureLeft?.categoryName === "Pointing_Up") {
              countPointer++;
            }
            if(countOpen > 4) {
              console.log(gestureLeft);
              nextSlide();
              countOpen = 0;
            } else if (countPointer) {
              prevSlide();
              countPointer = 0;
            }

            lastVideoTime = video.currentTime;
          } catch(e) {
            console.log(e);
          }
        }
        requestAnimationFrame(renderLoop);
      }

      if(video) {
        video.addEventListener('loadeddata', renderLoop);
      }

    }
    makeTasks();

    return(() => {
      poseLandmarker?.close();
      gestureRecognizer?.close();
    });

  }, [inputVideo]);
  
  return(
    <div>
      <video autoPlay id='inputVideo' ref={inputVideo} width={canvasWidth} height={canvasHeight} />
      <canvas id="outputVideo" ref={outputVideo} width={canvasWidth} height={canvasHeight} />
    </div>
  )
}