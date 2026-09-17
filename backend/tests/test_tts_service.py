import wave

import app.services.tts_service as tts_module


class FakeInlineData:
    data = b"\x00\x01\x02\x03\x04\x05\x06\x07"


class FakePart:
    def __init__(self):
        self.inline_data = FakeInlineData()


class FakeContent:
    def __init__(self):
        self.parts = [FakePart()]


class FakeCandidate:
    def __init__(self):
        self.content = FakeContent()


class FakeResponse:
    def __init__(self):
        self.candidates = [FakeCandidate()]


class FakeClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.calls = []

    @property
    def models(self):
        return self

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return FakeResponse()


def test_generate_swahili_speech_writes_valid_wav(monkeypatch, tmp_path):
    captured = {}

    def fake_client_factory(api_key):
        client = FakeClient(api_key)
        captured["api_key"] = api_key
        captured["client"] = client
        return client

    monkeypatch.setattr(tts_module.genai, "Client", fake_client_factory)

    output_path = tmp_path / "audio" / "question.wav"
    result = tts_module.TTSService.generate_swahili_speech("Habari za leo?", str(output_path))

    assert result == str(output_path)
    assert output_path.exists()

    with wave.open(str(output_path), "rb") as wav_file:
        assert wav_file.getnchannels() == 1
        assert wav_file.getsampwidth() == 2
        assert wav_file.getframerate() == 24000

    request_kwargs = captured["client"].calls[0]
    assert request_kwargs["model"] == "gemini-2.5-flash-preview-tts"
    assert request_kwargs["config"].response_modalities == ["audio"]
