# next-client-ssr

クライアントコンポーネントをサーバ上で動かす際、非同期処理が出来ないという誤解があります  
その誤解を解くために最小限のサンプルを用意しました

このサンプルではサーバ上で非同期データを取得し HTML で出力、ブラウザ上で Hydration して動作します

重要な点は、`throw property.promise`の部分です。ここで Promise が解決された際に、コンポーネントが再レンダリングされます。この機能は React の`renderToReadableStream`実行時の標準動作です。`<Suspense>`で囲むと、非同期待ちではなくストリーミングになってしまうので注意が必要です。

```tsx
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
```
