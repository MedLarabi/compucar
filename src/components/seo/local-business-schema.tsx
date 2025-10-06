"use client";

import { generateLocalBusinessSchema } from "@/lib/seo/local-seo";

export function LocalBusinessSchema() {
  const schemaData = generateLocalBusinessSchema();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData),
      }}
    />
  );
}
