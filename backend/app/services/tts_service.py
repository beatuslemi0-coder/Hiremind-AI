import wave
from pathlib import Path

from google import genai
from google.genai import types

from app.core.config import settings


class TTSService:

    @staticmethod
    def generate_swahili_speech(
        text: str,
        output_path: str
    ):
        
        tts_model = "gemini-2.5-flash-preview-tts"

        client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

        prompt = f"""
Speak the following interview question naturally in Swahili.

You are a professional AI interviewer conducting a job interview
for a candidate in Tanzania.

Use:
- Natural Swahili pronunciation
- Professional interviewer tone
- Clear speaking speed
- Friendly but professional voice

Read ONLY the following question:

{text}
"""

        response = client.models.generate_content(
            model=tts_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["audio"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="kore"
                        )
                    )
                )
            )
        )

        candidates = getattr(response, "candidates", [])
        if not candidates:
            raise ValueError("Gemini TTS did not return any candidate audio.")

        audio_part = next(
            (
                part for part in candidates[0].content.parts
                if getattr(getattr(part, "inline_data", None), "data", None) is not None
            ),
            None,
        )

        if audio_part is None:
            raise ValueError("Gemini TTS response did not include audio inline_data.")

        audio_data = audio_part.inline_data.data

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with wave.open(str(output_file), "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(24000)
            wav_file.writeframes(audio_data)

        return str(output_file)