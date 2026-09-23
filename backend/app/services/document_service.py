# Tunatumia os kwa ajili ya kutengeneza folders na file paths.
import os
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.models.document import Document, DocumentType


# Folder ambalo documents za candidates zitahifadhiwa.
UPLOAD_DIR = "uploads/documents"

# Tunahakikisha folder la uploads lipo.
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Service hii inahusika na kuhifadhi document.
class DocumentService:

    @staticmethod
    def upload_document(
        db: Session,
        user_id: int,
        document_type: DocumentType,
        file: UploadFile
    ):

        # Tunazuia file ambazo si PDF.
        if file.content_type != "application/pdf":
            raise ValueError(
                "Only PDF files are allowed"
            )

        # Tunapata extension ya file.
        extension = os.path.splitext(
            file.filename
        )[1].lower()

        # Tunatengeneza jina jipya la file.
        file_name = (
            f"{user_id}_"
            f"{document_type.value}"
            f"{extension}"
        )

        # Tunatengeneza full path ya file.
        file_path = os.path.join(
            UPLOAD_DIR,
            file_name
        )

        # Tunafungua file kwa ajili ya kuandika.
        with open(file_path, "wb") as buffer:

            # Tuna-copy contents za uploaded file.
            buffer.write(
                file.file.read()
            )

        # Tunatengeneza database record.
        document = Document(
            user_id=user_id,
            document_type=document_type,
            file_name=file.filename,
            file_path=file_path
        )

        db.add(document)
        db.commit()
        db.refresh(document)
        return document