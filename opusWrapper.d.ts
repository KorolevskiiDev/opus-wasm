export const OPUS_APPLICATION_VOIP = 2049;
export const OPUS_APPLICATION_AUDIO = 2048;
export const OPUS_APPLICATION_RESTRICTED_LOWDELAY = 2051;

export interface OpusEncoder {
    /**
     * Encodes a frame of PCM audio data.
     * @param pcmData - Input PCM data (e.g., Int16Array)
     * @returns Encoded Opus frame as Uint8Array.
     */
    encode(pcmData: Float32Array): Uint8Array;

    /** Destroy the encoder instance and free associated resources */
    destroy(): void;
}

export interface OpusDecoder {
    /**
     * Decodes an Opus-encoded frame.
     * @param encodedData - Input encoded data (Uint8Array)
     * @returns Decoded PCM audio data (e.g., Int16Array)
     */
    decode(encodedData: Uint8Array): Float32Array;

    /** Destroy the decoder instance and free associated resources */
    destroy(): void;
}

/**
 * Creates and initializes an Opus encoder.
 * @param wasmBinary - Opus WASM binary data
 * @param sampleRate - Sampling rate in Hz
 * @param frameSize - Frame size in samples
 * @param channels - Number of audio channels
 * @param application - Application mode (e.g., VOIP, audio, low delay)
 */
export function createEncoder(
    wasmBinary: ArrayBuffer,
    sampleRate: number,
    frameSize: number,
    channels: number,
    application: number
): Promise<OpusEncoder>;

/**
 * Creates and initializes an Opus decoder.
 * @param wasmBinary - Opus WASM binary data
 * @param sampleRate - Sampling rate in Hz
 * @param frameSize - Frame size in samples
 * @param channels - Number of audio channels
 */
export function createDecoder(
    wasmBinary: ArrayBuffer,
    sampleRate: number,
    frameSize: number,
    channels: number
): Promise<OpusDecoder>;
