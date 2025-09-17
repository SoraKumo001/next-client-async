"use client";
import { useRef, useSyncExternalStore, type FC } from "react";

const DATA_NAME = "DATA_TEST";

const Weather: FC<{
  property: { data?: unknown; promise?: Promise<unknown> };
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
          // サーバ側で天気予報データを取得
          property.promise = fetch(
            `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/130000.json`
          )
            .then((r) => r.json())
            .then((v) => (property.data = v));
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
    promise?: Promise<unknown>;
  }>({}).current;
  return <Weather property={property} />;
};

export default Page;
