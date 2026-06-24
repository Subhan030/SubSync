import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (supabase) return supabase;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url' || supabaseKey === 'your_supabase_service_role_key') {
        throw new Error("Supabase is not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.");
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    return supabase;
}

export async function uploadFileToSupabase(localFilePath: string, bucketName: string, remoteFilePath: string): Promise<string> {
    const client = getSupabaseClient();
    const fileBuffer = fs.readFileSync(localFilePath);
    
    const ext = path.extname(localFilePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.srt') contentType = 'text/plain';
    else if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.webm') contentType = 'video/webm';
    else if (ext === '.mp4') contentType = 'video/mp4';

    const { data, error } = await client
        .storage
        .from(bucketName)
        .upload(remoteFilePath, fileBuffer, {
            contentType: contentType,
            upsert: true
        });

    if (error) {
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    const { data: publicUrlData } = client.storage.from(bucketName).getPublicUrl(remoteFilePath);
    return publicUrlData.publicUrl;
}

export async function saveTranscript(data: {
    original_text: string,
    enhanced_text: string,
    segments: any[],
    cloud_video_url: string | null,
    cloud_srt_url: string | null
}): Promise<string> {
    const client = getSupabaseClient();
    
    const { data: result, error } = await client
        .from('transcripts')
        .insert([data])
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to save transcript to Supabase: ${error.message}`);
    }

    return result.id;
}

export async function getTranscript(id: string): Promise<any> {
    const client = getSupabaseClient();

    const { data, error } = await client
        .from('transcripts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(`Transcript not found: ${error.message}`);
    }

    return data;
}
