import { syncNotionToWriteups } from '../src/lib/sync/notionSync';

async function main() {
  console.log('----------------------------------------------------');
  console.log('⚡ Nulbyt3 Vault // Notion-to-Supabase Sync Engine');
  console.log('----------------------------------------------------');

  const stats = await syncNotionToWriteups();

  console.log('\nResults:');
  console.log(`Success: ${stats.success ? '✓ YES' : '✗ NO'}`);
  console.log(`Message: ${stats.message}`);
  console.log(`Pages Found: ${stats.pagesFound}`);
  console.log(`Pages Synchronized: ${stats.pagesSynced}`);
  console.log(`Images Rehosted: ${stats.imagesRehosted}`);
  console.log(`PDFs Generated: ${stats.pdfsGenerated}`);

  if (stats.syncedWriteups.length > 0) {
    console.log('\nSynchronized Writeups:');
    stats.syncedWriteups.forEach((w) => {
      console.log(` • [${w.platform}] ${w.title} (${w.slug}) - ${w.isRetired ? 'Retired' : 'Active'}`);
    });
  }

  if (stats.errors.length > 0) {
    console.log('\nWarnings / Errors:');
    stats.errors.forEach((e) => console.log(` - ${e}`));
  }

  console.log('----------------------------------------------------\n');
  process.exit(stats.success ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal sync failure:', err);
  process.exit(1);
});
