"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = getSupabaseClient;
exports.uploadFileToSupabase = uploadFileToSupabase;
exports.saveTranscript = saveTranscript;
exports.getTranscript = getTranscript;
const supabase_js_1 = require("@supabase/supabase-js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let supabase = null;
function getSupabaseClient() {
    if (supabase)
        return supabase;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url' || supabaseKey === 'your_supabase_service_role_key') {
        throw new Error("Supabase is not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.");
    }
    supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    return supabase;
}
async function uploadFileToSupabase(localFilePath, bucketName, remoteFilePath) {
    const client = getSupabaseClient();
    const fileBuffer = fs_1.default.readFileSync(localFilePath);
    const ext = path_1.default.extname(localFilePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.srt')
        contentType = 'text/plain';
    else if (ext === '.mp3')
        contentType = 'audio/mpeg';
    else if (ext === '.wav')
        contentType = 'audio/wav';
    else if (ext === '.webm')
        contentType = 'video/webm';
    else if (ext === '.mp4')
        contentType = 'video/mp4';
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
async function saveTranscript(data) {
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
async function getTranscript(id) {
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
