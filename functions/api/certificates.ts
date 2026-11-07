import {
  loadCertificates,
  saveCertificates,
  loadSignatures,
  saveSignatures,
  getActiveSignature,
  saveSignatureToR2,
  finalizeAndIssueCertificates,
  loadMockTest,
} from '../../src/server/certificateRouter';
import type { Certificate, CertificateSignatureRecord, VerifyCertificateResult } from '../../src/types/certificate';

export async function handleCertificateApiRequest(request: Request, env: any = {}): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // ─── 1. PUBLIC VERIFICATION: GET /api/certificates/public/:serial ───
    if (path.startsWith('/api/certificates/public/') && method === 'GET') {
      const serial = decodeURIComponent(path.replace('/api/certificates/public/', '').trim());
      const certs = loadCertificates();
      const found = certs.find((c) => c.serial.toUpperCase() === serial.toUpperCase());

      if (!found) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Certificate not found', valid: false }),
          { status: 404, headers: corsHeaders }
        );
      }

      // Never expose private signature URL or internal storage paths
      const result: VerifyCertificateResult = {
        valid: found.status === 'valid',
        status: found.status,
        student_name: found.student_name,
        mock_name: found.mock_name, // Exact mock name character-for-character
        rank: found.rank,
        score: found.score,
        total_questions: found.total_questions,
        percentage: found.percentage,
        participants_count: found.participants_count,
        serial: found.serial,
        issued_at: found.issued_at,
        signatory_name: found.signatory_name,
        signatory_title: found.signatory_title,
        theme_id: found.theme_id,
      };

      return new Response(JSON.stringify({ ok: true, certificate: result }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ─── 2. STUDENT CERTIFICATES: GET /api/certificates/mine ───
    if (path === '/api/certificates/mine' && method === 'GET') {
      // In dev, we return all or match by auth token
      const authHeader = request.headers.get('authorization') || '';
      const certs = loadCertificates();

      // If user provided token, we can match by UID, or return their issued certificates
      let userUid = '';
      if (authHeader.startsWith('Bearer ')) {
        try {
          const payload = JSON.parse(atob(authHeader.split('.')[1] || ''));
          userUid = payload.sub || payload.user_id || '';
        } catch {}
      }

      const activeSig = getActiveSignature();
      const filtered = certs.map((c) => ({
        ...c,
        signature_data_url: c.signature_data_url || activeSig?.signature_data_url || null,
      }));

      // If uid known, filter; otherwise return list
      const matched = userUid ? filtered.filter((c) => c.student_uid === userUid) : filtered;
      return new Response(JSON.stringify({ ok: true, certificates: matched }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ─── 3. ADMIN CERTIFICATES: GET /api/admin/certificates ───
    if (path === '/api/admin/certificates' && method === 'GET') {
      const certs = loadCertificates();
      const activeSig = getActiveSignature();

      const enriched = certs.map((c) => ({
        ...c,
        signature_data_url: c.signature_data_url || activeSig?.signature_data_url || null,
      }));

      return new Response(
        JSON.stringify({
          ok: true,
          certificates: enriched,
          activeSignature: activeSig,
          hasActiveSignature: Boolean(activeSig),
          totalCount: certs.length,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ─── 4. ADMIN REGENERATE CERTIFICATE: POST /api/admin/certificates/:id/regenerate ───
    const regenMatch = path.match(/^\/api\/admin\/certificates\/([^/]+)\/regenerate$/);
    if (regenMatch && method === 'POST') {
      const certId = decodeURIComponent(regenMatch[1]);
      const certs = loadCertificates();
      const index = certs.findIndex((c) => c.id === certId || c.serial === certId);

      if (index === -1) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Certificate not found' }),
          { status: 404, headers: corsHeaders }
        );
      }

      const current = certs[index];
      const activeSig = getActiveSignature();

      // Look up current exact mock name
      const mock = loadMockTest(current.grand_line_id);
      const exactMockName = mock ? String(mock.title || mock.name) : current.mock_name;

      certs[index] = {
        ...current,
        mock_name: exactMockName, // Updates to latest exact mock name
        signatory_name: activeSig ? activeSig.signatory_name : current.signatory_name,
        signatory_title: activeSig ? activeSig.signatory_title : current.signatory_title,
        signature_version: activeSig ? activeSig.version : current.signature_version,
        signature_data_url: activeSig ? activeSig.signature_data_url : current.signature_data_url,
        updated_at: new Date().toISOString(),
      };

      saveCertificates(certs);
      return new Response(JSON.stringify({ ok: true, certificate: certs[index] }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ─── 5. ADMIN REVOKE / RESTORE: POST /api/admin/certificates/:id/revoke ───
    const revokeMatch = path.match(/^\/api\/admin\/certificates\/([^/]+)\/revoke$/);
    if (revokeMatch && method === 'POST') {
      const certId = decodeURIComponent(revokeMatch[1]);
      const body = await request.json().catch(() => ({}));
      const revoke = Boolean(body.revoke);

      const certs = loadCertificates();
      const index = certs.findIndex((c) => c.id === certId || c.serial === certId);

      if (index === -1) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Certificate not found' }),
          { status: 404, headers: corsHeaders }
        );
      }

      certs[index].status = revoke ? 'revoked' : 'valid';
      certs[index].updated_at = new Date().toISOString();
      saveCertificates(certs);

      return new Response(JSON.stringify({ ok: true, certificate: certs[index] }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ─── 6. ADMIN REGENERATE ALL: POST /api/admin/certificates/regenerate-all ───
    if (path === '/api/admin/certificates/regenerate-all' && method === 'POST') {
      const certs = loadCertificates();
      const activeSig = getActiveSignature();
      const now = new Date().toISOString();

      let updatedCount = 0;
      for (let i = 0; i < certs.length; i++) {
        const mock = loadMockTest(certs[i].grand_line_id);
        const exactMockName = mock ? String(mock.title || mock.name) : certs[i].mock_name;

        certs[i] = {
          ...certs[i],
          mock_name: exactMockName,
          signatory_name: activeSig ? activeSig.signatory_name : certs[i].signatory_name,
          signatory_title: activeSig ? activeSig.signatory_title : certs[i].signatory_title,
          signature_version: activeSig ? activeSig.version : certs[i].signature_version,
          signature_data_url: activeSig ? activeSig.signature_data_url : certs[i].signature_data_url,
          updated_at: now,
        };
        updatedCount++;
      }

      saveCertificates(certs);
      return new Response(JSON.stringify({ ok: true, updatedCount }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ─── 7. ADMIN SIGNATURE: GET /api/admin/signature ───
    if (path === '/api/admin/signature' && method === 'GET') {
      const allSigs = loadSignatures();
      const active = allSigs.find((s) => s.active) || null;
      return new Response(
        JSON.stringify({ ok: true, activeSignature: active, history: allSigs }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ─── 8. ADMIN SIGNATURE: POST /api/admin/signature ───
    if (path === '/api/admin/signature' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const signatoryName = String(body.signatoryName || '').trim();
      const signatoryTitle = String(body.signatoryTitle || '').trim();
      const signatureDataUrl = String(body.signatureDataUrl || '');

      if (!signatoryName || !signatoryTitle || !signatureDataUrl) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Signatory name, title, and signature data are required.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const allSigs = loadSignatures();
      const newVersion = allSigs.length > 0 ? Math.max(...allSigs.map((s) => s.version)) + 1 : 1;

      // Save privately to Cloudflare R2 / local R2 bucket dir
      const r2Key = saveSignatureToR2(newVersion, signatureDataUrl);

      // Mark all existing signatures as inactive
      for (const sig of allSigs) {
        sig.active = false;
      }

      const newSig: CertificateSignatureRecord = {
        id: `sig_${crypto.randomUUID()}`,
        r2_key: r2Key,
        signatory_name: signatoryName,
        signatory_title: signatoryTitle,
        version: newVersion,
        uploaded_by: 'admin',
        signature_data_url: signatureDataUrl,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      allSigs.unshift(newSig);
      saveSignatures(allSigs);

      return new Response(JSON.stringify({ ok: true, signature: newSig }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ─── 9. ADMIN SIGNATURE: DELETE /api/admin/signature ───
    if (path === '/api/admin/signature' && method === 'DELETE') {
      const allSigs = loadSignatures();
      for (const sig of allSigs) {
        sig.active = false;
      }
      saveSignatures(allSigs);
      return new Response(JSON.stringify({ ok: true, message: 'Active signature removed.' }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ─── 10. FINALIZE MOCK RESULTS & ISSUE CERTIFICATES: POST /api/tests/:id/finalize-certificates ───
    const finalizeMatch = path.match(/^\/api\/tests\/([^/]+)\/finalize-certificates$/);
    if (finalizeMatch && method === 'POST') {
      const testId = decodeURIComponent(finalizeMatch[1]);
      const res = await finalizeAndIssueCertificates(testId);
      return new Response(JSON.stringify({ ok: true, ...res }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: false, error: `Endpoint not found: ${path}` }), {
      status: 404,
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error('[handleCertificateApiRequest] Error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || 'Certificate API error' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
