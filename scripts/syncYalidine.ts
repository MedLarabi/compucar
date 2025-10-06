import { syncYalidineLocations, writeSnapshotJson } from "@/lib/yalidine/sync";

async function main() {
  const start = Date.now();
  const res = await syncYalidineLocations();
  await writeSnapshotJson();
  const ms = Date.now() - start;
  // eslint-disable-next-line no-console
  console.log(`Yalidine sync done in ${ms}ms:`, res);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


