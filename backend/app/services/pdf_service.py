# Tunatumia PdfReader kusoma maandishi yaliyomo kwenye PDF.
from pypdf import PdfReader


# Service hii inahusika na kusoma maandishi kutoka kwenye PDF.
class PDFService:

    @staticmethod
    def extract_text(file_path: str) -> str:

        # Tunafungua PDF iliyohifadhiwa kwenye server.
        reader = PdfReader(file_path)

        # Hapa tutahifadhi text ya pages zote.
        extracted_text = []

        # Tunapita kwenye kila page ya PDF.
        for page in reader.pages:

            # Tunatoa maandishi yaliyomo kwenye page.
            text = page.extract_text()

            # Kama page ina text, tunaiongeza kwenye list.
            if text:
                extracted_text.append(text)

        # Tunaunganisha text zote za pages kuwa text moja.
        return "\n".join(extracted_text)