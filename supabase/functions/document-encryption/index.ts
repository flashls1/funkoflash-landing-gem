import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AES-256-GCM encryption/decryption functions
async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(data: ArrayBuffer, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );
  return { encrypted, iv };
}

async function decryptData(encryptedData: ArrayBuffer, key: CryptoKey, iv: ArrayBuffer): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedData
  );
}

async function keyFromString(keyString: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString.padEnd(32, '0').slice(0, 32)); // Ensure 32 bytes
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, fileData, fileName, talentId, documentType, encryptedData, iv } = await req.json();
    
    // Use talent ID and document type to create a unique encryption key
    const keyString = `${Deno.env.get('ENCRYPTION_SECRET_KEY') || 'default-secret-key'}-${talentId}-${documentType}`;
    const encryptionKey = await keyFromString(keyString);

    if (action === 'encrypt') {
      // Convert base64 file data to ArrayBuffer more efficiently
      const base64Data = fileData.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      // Use batch processing to avoid stack overflow
      const chunkSize = 65536; // Process in 64KB chunks
      for (let i = 0; i < binaryString.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, binaryString.length);
        for (let j = i; j < end; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
      }

      // Encrypt the file data
      const { encrypted, iv } = await encryptData(bytes.buffer, encryptionKey);
      
      // Convert encrypted data to base64 for storage more efficiently
      const encryptedArray = new Uint8Array(encrypted);
      const ivArray = new Uint8Array(iv);
      
      // Convert to base64 using chunks to avoid stack overflow
      function arrayToBase64(array: Uint8Array): string {
        const chunkSize = 32768; // 32KB chunks
        let result = '';
        for (let i = 0; i < array.length; i += chunkSize) {
          const chunk = array.slice(i, i + chunkSize);
          result += String.fromCharCode(...chunk);
        }
        return btoa(result);
      }
      
      const encryptedBase64 = arrayToBase64(encryptedArray);
      const ivBase64 = arrayToBase64(ivArray);

      // Upload encrypted file to Supabase Storage
      const fileExtension = fileName.split('.').pop();
      const encryptedFileName = `encrypted_${documentType}_${talentId}.${fileExtension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('talent-documents')
        .upload(encryptedFileName, encryptedArray, {
          contentType: 'application/octet-stream',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('talent-documents')
        .getPublicUrl(encryptedFileName);

      return new Response(
        JSON.stringify({
          success: true,
          fileUrl: urlData.publicUrl,
          iv: ivBase64,
          encrypted: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (action === 'decrypt') {
      // Sanitize fileName to remove query parameters and get base filename
      const sanitizedFileName = fileName.split('?')[0].split('/').pop() || fileName;
      console.log('Sanitized fileName:', sanitizedFileName);
      
      // Extract file extension from sanitized filename
      const fileExtensionMatch = sanitizedFileName.match(/\.([^.]+)$/);
      const fileExtension = fileExtensionMatch ? fileExtensionMatch[1] : 'jpg'; // Default to jpg
      
      console.log('Determined file extension:', fileExtension);
      
      // First, try to find the correct encrypted file by listing objects
      const { data: listData, error: listError } = await supabase.storage
        .from('talent-documents')
        .list('', {
          search: `encrypted_${documentType}_${talentId}`
        });
      
      if (listError) {
        console.error('Error listing storage objects:', listError);
      }
      
      let encryptedFileName: string;
      
      if (listData && listData.length > 0) {
        // Find the best matching file
        const matchingFile = listData.find(file => 
          file.name.includes(`encrypted_${documentType}_${talentId}`)
        );
        
        if (matchingFile) {
          encryptedFileName = matchingFile.name;
          console.log('Found matching file:', encryptedFileName);
        } else {
          // Fallback to constructed filename
          encryptedFileName = `encrypted_${documentType}_${talentId}.${fileExtension}`;
          console.log('Using fallback filename:', encryptedFileName);
        }
      } else {
        // Try common extensions if list failed
        const commonExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        encryptedFileName = `encrypted_${documentType}_${talentId}.${fileExtension}`;
        
        // Try different extensions if the primary one doesn't work
        for (const ext of commonExtensions) {
          if (ext !== fileExtension) {
            console.log(`Trying alternative extension: ${ext}`);
            // We'll handle this in the download error section
          }
        }
      }
      
      console.log('Attempting to download:', encryptedFileName);
      
      // Download encrypted file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('talent-documents')
        .download(encryptedFileName);

      if (downloadError) {
        console.error('Download error for', encryptedFileName, ':', downloadError);
        
        // Try alternative extensions if the primary download failed
        const commonExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        let alternativeSuccess = false;
        let alternativeFileData: Blob | null = null;
        
        for (const ext of commonExtensions) {
          if (ext !== fileExtension) {
            const altFileName = `encrypted_${documentType}_${talentId}.${ext}`;
            console.log('Trying alternative filename:', altFileName);
            
            const { data: altFileData, error: altError } = await supabase.storage
              .from('talent-documents')
              .download(altFileName);
              
            if (!altError && altFileData) {
              console.log('Successfully downloaded with alternative extension:', ext);
              alternativeFileData = altFileData;
              encryptedFileName = altFileName;
              alternativeSuccess = true;
              break;
            }
          }
        }
        
        if (!alternativeSuccess) {
          throw new Error(`File not found: ${encryptedFileName}. Original error: ${downloadError.message}`);
        }
        
        // Use the alternative file data
        fileData = alternativeFileData;
      }

      // Convert file data to ArrayBuffer
      const encryptedBuffer = await fileData.arrayBuffer();
      const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0)).buffer;

      // Decrypt the data
      const decryptedData = await decryptData(encryptedBuffer, encryptionKey, ivBuffer);
      
      // Convert decrypted data to base64 data URL more efficiently
      const decryptedArray = new Uint8Array(decryptedData);
      
      // Convert to base64 using chunks to avoid stack overflow  
      function arrayToBase64(array: Uint8Array): string {
        const chunkSize = 32768; // 32KB chunks
        let result = '';
        for (let i = 0; i < array.length; i += chunkSize) {
          const chunk = array.slice(i, i + chunkSize);
          result += String.fromCharCode(...chunk);
        }
        return btoa(result);
      }
      
      const decryptedBase64 = arrayToBase64(decryptedArray);
      
      // Determine MIME type based on file extension
      const ext = (fileExtension || fileName.split('.').pop() || '').toLowerCase();
      let mimeType = 'application/octet-stream';
      if (ext === 'jpg' || ext === 'jpeg') {
        mimeType = 'image/jpeg';
      } else if (ext === 'png') {
        mimeType = 'image/png';
      } else if (ext === 'pdf') {
        mimeType = 'application/pdf';
      }

      const dataUrl = `data:${mimeType};base64,${decryptedBase64}`;

      return new Response(
        JSON.stringify({
          success: true,
          decryptedDataUrl: dataUrl
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error) {
    console.error('Encryption/Decryption error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});