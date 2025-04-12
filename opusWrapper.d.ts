export interface OpusEncoder {
    /**
     * Encodes a frame of PCM audio data.
     * @param pcmData - Input PCM data (e.g., Int16Array)
     * @returns Encoded Opus frame as Uint8Array.
     */
    encode(pcmData: Int16Array): Uint8Array;

    /** Destroy the encoder instance and free associated resources */
    destroy(): void;
}

export interface OpusDecoder {
    /**
     * Decodes an Opus-encoded frame.
     * @param encodedData - Input encoded data (Uint8Array)
     * @returns Decoded PCM audio data (e.g., Int16Array)
     */
    decode(encodedData: Uint8Array): Int16Array;

    /** Destroy the decoder instance and free associated resources */
    destroy(): void;
}

/**
 * Creates and initializes an Opus encoder.
 * @param sampleRate - Sampling rate in Hz
 * @param channels - Number of audio channels
 * @param application - Application mode (e.g., VOIP, audio, low delay)
 */
export function createEncoder(
    sampleRate: number,
    channels: number,
    application: number
): Promise<OpusEncoder>;

/**
 * Creates and initializes an Opus decoder.
 * @param sampleRate - Sampling rate in Hz
 * @param channels - Number of audio channels
 */
export function createDecoder(
    sampleRate: number,
    channels: number
): Promise<OpusDecoder>;
