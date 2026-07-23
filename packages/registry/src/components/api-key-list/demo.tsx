"use client";

import { useState } from "react";

import type { ApiKey, ApiKeyScope } from "./api-key-list";
import { ApiKeyList } from "./api-key-list";
import { apiKeys } from "./fixtures";

const randomToken = () =>
  `neon_${crypto.randomUUID().replaceAll("-", "")}${crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 16)}`;

export const ApiKeyListDemo = () => {
  const [keys, setKeys] = useState<ApiKey[]>(apiKeys);

  return (
    <ApiKeyList
      className="w-full max-w-lg"
      keys={keys}
      onCreate={(name, scope: ApiKeyScope) => {
        setKeys((current) => [
          { createdAt: "just now", id: crypto.randomUUID(), name, scope },
          ...current,
        ]);

        return randomToken();
      }}
      onRevoke={(key) =>
        setKeys((current) => current.filter((item) => item.id !== key.id))
      }
    />
  );
};

export default ApiKeyListDemo;
