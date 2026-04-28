import { chromium, Browser, Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WorkerArgs {
  run_id: string;
  portal: string;
  dateRange: string;
}

export async function runProvarPull({ run_id, portal, dateRange }: WorkerArgs) {
  const isDryRun = process.env.PROVAR_DRY_RUN === 'true';
  let browser: Browser | null = null;

  try {
    // 1. Update status to running
    await supabase
      .from('provar_pull_runs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', run_id);

    console.log(`Starting pull run ${run_id} (portal: ${portal}, dryRun: ${isDryRun})`);

    if (isDryRun) {
      await runDryRun(run_id, portal);
    } else {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await runRealRun(run_id, portal, dateRange, page);
    }

    // 2. Mark as completed
    await supabase
      .from('provar_pull_runs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', run_id);

  } catch (err: any) {
    console.error(`Run ${run_id} failed:`, err);
    await supabase
      .from('provar_pull_runs')
      .update({ 
        status: 'failed', 
        error_message: err.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', run_id);
  } finally {
    if (browser) await browser.close();
  }
}

async function runDryRun(run_id: string, portal: string) {
  const mockContainers = ['MNBU345678', 'MSKU987654', 'TGBU112233'];
  
  await supabase
    .from('provar_pull_runs')
    .update({ total_containers: mockContainers.length })
    .eq('id', run_id);

  for (const container_id of mockContainers) {
    console.log(`Dry run: Processing ${container_id}`);
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Upload fake PDF
    const pdfPath = `provar/${portal}/${new Date().toISOString().slice(0,10)}/${container_id}/pdf/mock.pdf`;
    const pdfContent = Buffer.from('Mock PDF content');
    await supabase.storage.from('provar-documents').upload(pdfPath, pdfContent, { contentType: 'application/pdf' });

    await supabase.from('provar_documents').insert({
      pull_run_id: run_id,
      portal,
      container_id,
      document_type: 'pdf',
      file_path: pdfPath,
      file_name: 'mock.pdf',
      mime_type: 'application/pdf'
    });

    // Upload fake screenshot
    const ssPath = `provar/${portal}/${new Date().toISOString().slice(0,10)}/${container_id}/screenshots/mock.png`;
    const ssContent = Buffer.from('Mock Image content');
    await supabase.storage.from('provar-documents').upload(ssPath, ssContent, { contentType: 'image/png' });

    await supabase.from('provar_documents').insert({
      pull_run_id: run_id,
      portal,
      container_id,
      document_type: 'screenshot',
      file_path: ssPath,
      file_name: 'mock.png',
      mime_type: 'image/png'
    });

    // Update progress
    const { data: currentRun } = await supabase.from('provar_pull_runs').select('processed_containers, downloaded_pdfs, downloaded_screenshots').eq('id', run_id).single();
    await supabase
      .from('provar_pull_runs')
      .update({ 
        processed_containers: (currentRun?.processed_containers || 0) + 1,
        downloaded_pdfs: (currentRun?.downloaded_pdfs || 0) + 1,
        downloaded_screenshots: (currentRun?.downloaded_screenshots || 0) + 1
      })
      .eq('id', run_id);
  }
}

async function runRealRun(run_id: string, portal: string, dateRange: string, page: Page) {
  const baseUrl = process.env.PROVAR_BASE_URL || 'https://app.provar.io';
  const email = process.env.PROVAR_EMAIL;
  const password = process.env.PROVAR_PASSWORD;

  if (!email || !password) throw new Error('PROVAR_EMAIL or PROVAR_PASSWORD not set');

  await page.goto(`${baseUrl}/login`);
  
  // Login
  if (await page.isVisible('input[name="email"]')) {
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  }

  // Check for CAPTCHA/MFA
  if (await page.isVisible('text=Verify your identity') || await page.isVisible('.g-recaptcha')) {
    throw new Error('MFA or CAPTCHA detected. Human intervention required.');
  }

  await page.goto(`${baseUrl}/d-and-defender`);
  
  // Apply filters if needed
  // ...

  // Click Pull All Portals
  const pullButton = page.getByRole('button', { name: /pull all portals/i });
  if (await pullButton.isVisible()) {
    await pullButton.click();
    // Wait for loading indicator to finish
    await page.waitForSelector('.loading-overlay', { state: 'detached', timeout: 60000 });
  }

  // Extract containers
  const containerRows = page.locator('.container-row'); // Selector needs verification
  const count = await containerRows.count();
  
  await supabase
    .from('provar_pull_runs')
    .update({ total_containers: count })
    .eq('id', run_id);

  for (let i = 0; i < count; i++) {
    const row = containerRows.nth(i);
    const containerId = await row.getAttribute('data-container-id') || `C${i}`; // Selector needs verification
    
    try {
      // 1. Download PDF
      const [downloadPdf] = await Promise.all([
        page.waitForEvent('download'),
        row.getByRole('button', { name: /print pdf/i }).click(),
      ]);
      const pdfPath = await downloadPdf.path();
      if (pdfPath) {
        const storagePath = `provar/${portal}/${new Date().toISOString().slice(0,10)}/${containerId}/pdf/${downloadPdf.suggestedFilename()}`;
        const pdfBuffer = fs.readFileSync(pdfPath);
        await supabase.storage.from('provar-documents').upload(storagePath, pdfBuffer);
        
        await supabase.from('provar_documents').insert({
          pull_run_id: run_id,
          portal,
          container_id: containerId,
          document_type: 'pdf',
          file_path: storagePath,
          file_name: downloadPdf.suggestedFilename(),
        });
      }

      // 2. Download Screenshots
      const [downloadSs] = await Promise.all([
        page.waitForEvent('download'),
        row.getByRole('button', { name: /download screenshots/i }).click(),
      ]);
      const ssPath = await downloadSs.path();
      if (ssPath) {
        const storagePath = `provar/${portal}/${new Date().toISOString().slice(0,10)}/${containerId}/screenshots/${downloadSs.suggestedFilename()}`;
        const ssBuffer = fs.readFileSync(ssPath);
        await supabase.storage.from('provar-documents').upload(storagePath, ssBuffer);

        await supabase.from('provar_documents').insert({
          pull_run_id: run_id,
          portal,
          container_id: containerId,
          document_type: 'screenshot',
          file_path: storagePath,
          file_name: downloadSs.suggestedFilename(),
        });
      }

      // Update counters
      const { data: currentRun } = await supabase.from('provar_pull_runs').select('processed_containers, downloaded_pdfs, downloaded_screenshots').eq('id', run_id).single();
      await supabase
        .from('provar_pull_runs')
        .update({ 
          processed_containers: (currentRun?.processed_containers || 0) + 1,
          downloaded_pdfs: (currentRun?.downloaded_pdfs || 0) + 1,
          downloaded_screenshots: (currentRun?.downloaded_screenshots || 0) + 1
        })
        .eq('id', run_id);

    } catch (rowErr: any) {
      console.error(`Error processing container ${containerId}:`, rowErr);
      const { data: currentRun } = await supabase.from('provar_pull_runs').select('error_count').eq('id', run_id).single();
      await supabase
        .from('provar_pull_runs')
        .update({ 
          error_count: (currentRun?.error_count || 0) + 1,
          error_message: `Last error: ${rowErr.message}`
        })
        .eq('id', run_id);
    }
  }
}
