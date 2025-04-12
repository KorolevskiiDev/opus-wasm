import createOpusModule from './opusCodec.js';

async function initializeOpus() {
    return await createOpusModule();
}

export async function createEncoder(sampleRate, channels, application) {
    const OpusModule = await initializeOpus();
    // Allocate a pointer for error reporting if needed
    const errPtr = OpusModule._malloc(4);
    // Create encoder; note the return type is a pointer (number)
    const encoderPtr = OpusModule.ccall(
        'opus_encoder_create', // function name in C
        'number',              // return type
        ['number', 'number', 'number', 'number'],  // argument types
        [sampleRate, channels, application, errPtr]
    );
    // Retrieve error value (if desired) and free temporary memory
    const err = OpusModule.getValue(errPtr, 'i32');
    OpusModule._free(errPtr);

    if (err !== 0) {
        throw new Error(`Opus encoder creation failed: error code ${err}`);
    }

    return {
        encoderPtr,
        module: OpusModule,
        encode: (pcmData) => {
            const pcmPtr = OpusModule._malloc(pcmData.length * pcmData.BYTES_PER_ELEMENT);
            OpusModule.HEAP16.set(pcmData, pcmPtr / pcmData.BYTES_PER_ELEMENT);

            const maxOutputBytes = 4000; // Adjust based on expected output size
            const outputPtr = OpusModule._malloc(maxOutputBytes);

            const encodedBytes = OpusModule.ccall(
                'opus_encode',
                'number',
                ['number', 'number', 'number', 'number', 'number', 'number'],
                [encoderPtr, pcmPtr, pcmData.length / channels, outputPtr, maxOutputBytes]
            );

            const encodedData = new Uint8Array(OpusModule.HEAPU8.subarray(outputPtr, outputPtr + encodedBytes));

            OpusModule._free(pcmPtr);
            OpusModule._free(outputPtr);

            return encodedData;
        },
        destroy: () => {
            OpusModule.ccall('opus_encoder_destroy', null, ['number'], [encoderPtr]);
        },
    };
}

export async function createDecoder(sampleRate, channels) {
    const OpusModule = await initializeOpus();
    const errPtr = OpusModule._malloc(4);
    const decoderPtr = OpusModule.ccall(
        'opus_decoder_create',
        'number',
        ['number', 'number', 'number'],
        [sampleRate, channels, errPtr]
    );
    const err = OpusModule.getValue(errPtr, 'i32');
    OpusModule._free(errPtr);

    if (err !== 0) {
        throw new Error(`Opus decoder creation failed: error code ${err}`);
    }

    return {
        decoderPtr,
        module: OpusModule,
        decode: (encodedData) => {
            const encodedPtr = OpusModule._malloc(encodedData.length);
            OpusModule.HEAPU8.set(encodedData, encodedPtr);

            const maxSamples = 120 * sampleRate / 1000 * channels; // 120ms frame size
            const pcmPtr = OpusModule._malloc(maxSamples * 2); // Int16Array, 2 bytes per sample

            const decodedSamples = OpusModule.ccall(
                'opus_decode',
                'number',
                ['number', 'number', 'number', 'number', 'number', 'number'],
                [decoderPtr, encodedPtr, encodedData.length, pcmPtr, maxSamples, 0]
            );

            const pcmData = new Int16Array(OpusModule.HEAP16.subarray(pcmPtr / 2, pcmPtr / 2 + decodedSamples * channels));

            OpusModule._free(encodedPtr);
            OpusModule._free(pcmPtr);

            return pcmData;
        },
        destroy: () => {
            OpusModule.ccall('opus_decoder_destroy', null, ['number'], [decoderPtr]);
        },
    };
}
