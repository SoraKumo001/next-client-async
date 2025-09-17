"use client";
import { useRef, useSyncExternalStore, type FC } from "react";

const DATA_NAME = "DATA_TEST";

const Weather: FC<{
  property: { data?: unknown; promise?: Promise<void> };
}> = ({ property }) => {
  const data = useSyncExternalStore(
    () => () => {},
    () => property.data,
    () => {
      if (!property.data) {
        if (typeof window !== "undefined") {
          // ブラウザ側でHydration直後にデータを受け取る
          const node = document.getElementById(DATA_NAME);
          property.data = JSON.parse(node.innerHTML);
        } else if (!property.promise) {
          // サーバ(物理)動作時に天気予報データを取得
          const getWeather = async () => {
            const result = await fetch(
              `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/130000.json`
            );
            property.data = await result.json();
          };
          property.promise = getWeather();
          // Promiseを解決後、再レンダリングさせる
          throw property.promise;
        }
      }
      return property.data;
    }
  );
  return (
    <>
      {/* クライアントへ渡すデータをHTML化 */}
      <script
        id={DATA_NAME}
        type="application/json"
        dangerouslySetInnerHTML={{
          // データをJSON文字列に変換と、HTML用にエスケープ
          __html: JSON.stringify(data).replace(/</g, "\\u003c"),
        }}
      />
      {/* 確認表示用 */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

const Page = () => {
  const property = useRef<{
    data?: unknown;
    promise?: Promise<void>;
  }>({}).current;
  return <Weather property={property} />;
};

export default Page;
