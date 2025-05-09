import createOpusModule from './opusCodec.js';

export const OPUS_APPLICATION_VOIP = 2049;
export const OPUS_APPLICATION_AUDIO = 2048;
export const OPUS_APPLICATION_RESTRICTED_LOWDELAY = 2051;

export async function createEncoder(wasmBinary, sampleRate, frameSize, channels, application) {
    const OpusModule = await createOpusModule({
        wasmBinary: wasmBinary,
        locateFile: (filename) => {
            console.log("Trying to locate file: ", filename);
            return filename;
        }
    });

    const errPtr = OpusModule._malloc(4);
    console.log("OpusModule creating encoder with settings: ", { sampleRate, channels, application, errPtr });

    const encoderPtr = OpusModule._opus_encoder_create(sampleRate, channels, application, errPtr);

    const err = OpusModule.getValue(errPtr);
    OpusModule._free(errPtr);

    if (err !== 0) {
        throw new Error(`Opus encoder creation failed: error code ${err}`);
    }

    return {
        encoderPtr,
        module: OpusModule,
        encode: (pcmData) => {
            const pcmPtr = OpusModule._malloc(pcmData.length * pcmData.BYTES_PER_ELEMENT);
            OpusModule.HEAPF32.set(pcmData, pcmPtr / 4); // Correct offset

            const maxOutputBytes = 4000; // Adjust based on expected output size
            const outputPtr = OpusModule._malloc(maxOutputBytes);

            const expectedLength = frameSize * channels;
            if (pcmData.length !== expectedLength) {
                console.error("Invalid pcmData length:", pcmData.length, "expected:", expectedLength);
                return new Uint8Array(0);
            }

            const encodedBytes = OpusModule._opus_encode_float(encoderPtr, pcmPtr, frameSize, outputPtr, maxOutputBytes);

            if (encodedBytes < 0) {
                console.error("Encoding failed with error:", OpusModule._opus_strerror(encodedBytes));
                OpusModule._free(pcmPtr);
                OpusModule._free(outputPtr);
                return new Uint8Array(0);
            }

            const encodedData = new Uint8Array(OpusModule.HEAPU8.subarray(outputPtr, outputPtr + encodedBytes));

            OpusModule._free(pcmPtr);
            OpusModule._free(outputPtr);

            return encodedData;
        },
        destroy: () => {
            OpusModule._opus_encoder_destroy(encoderPtr);
        },
    };
}

export async function createDecoder(wasmBinary, sampleRate, frameSize, channels) {
    const OpusModule = await createOpusModule({
        wasmBinary: wasmBinary,
        locateFile: (filename) => {
            console.log("Trying to locate file: ", filename);
            return filename;
        }
    });

    const errPtr = OpusModule._malloc(4);
    const decoderPtr = OpusModule._opus_decoder_create(sampleRate, channels, errPtr);
    const err = OpusModule.getValue(errPtr);
    OpusModule._free(errPtr);

    if (err !== 0) {
        throw new Error(`Opus decoder creation failed: error code ${OpusModule._opus_strerror(err)}`);
    }

    return {
        decoderPtr,
        module: OpusModule,
        decode: (encodedData) => {
            const encodedPtr = OpusModule._malloc(encodedData.length * encodedData.BYTES_PER_ELEMENT);
            OpusModule.HEAPU8.set(encodedData, encodedPtr);

            const pcmPtr = OpusModule._malloc(frameSize * 4); // Float32Array, 4 bytes per sample

            const decodedSamples = OpusModule._opus_decode_float(decoderPtr, encodedPtr, encodedData.length, pcmPtr, frameSize, 0);

            if (decodedSamples < 0) {
                console.error("Encoding failed with error:", OpusModule._opus_strerror(decodedSamples));
                OpusModule._free(pcmPtr);
                OpusModule._free(encodedPtr);
                return new Uint8Array(0);
            }

            const pcmData = new Float32Array(OpusModule.HEAPF32.subarray(pcmPtr / 4, (pcmPtr / 4) + decodedSamples));

            OpusModule._free(encodedPtr);
            OpusModule._free(pcmPtr);

            return pcmData;
        },
        destroy: () => {
            OpusModule._opus_decoder_destroy(decoderPtr);
        },
    };
}
