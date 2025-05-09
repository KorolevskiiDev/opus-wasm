# Makefile for building the Opus codec with Emscripten

build:
	emcc \
		-s WASM=1 \
		-s FETCH=1 \
		-s MODULARIZE=1 \
		-s AUDIO_WORKLET=1 \
		-s WASM_WORKERS=1 \
		-s EXPORT_ES6=1 \
		-s ENVIRONMENT="web,worker" \
		-s "EXPORTED_FUNCTIONS=[ \
			'_opus_encoder_create', \
			'_opus_encode_float', \
			'_opus_decoder_create', \
			'_opus_decode_float', \
			'_opus_encoder_destroy', \
			'_opus_decoder_destroy', \
			'_malloc', \
			'_free', \
			'_opus_strerror']" \
		-s "EXPORTED_RUNTIME_METHODS=[ \
			'ccall', \
			'cwrap', \
			'getValue']" \
		-Wl,--whole-archive opus/.libs/libopus.a -Wl,--no-whole-archive \
		-o opusCodec.js
