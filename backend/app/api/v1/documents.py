# APIRouter inatusaidia kutengeneza document endpoints.
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException

# SQLAlchemy Session.
from sqlalchemy.orm import Session

# Database dependency.
from app.db.session import get_db

# Authentication dependency.
from app.api.dependencies import get_current_user

# User model.
from app.models.user import User

# Document type.
from app.models.document import DocumentType

# Document service.
from app.services.document_service import DocumentService

# PDF service inayosoma maandishi kutoka kwenye PDF.
from app.services.pdf_service import PDFService

# Document model kwa ajili ya kutafuta document kwenye database.
from app.models.document import Document

# AI service inayochambua maandishi ya document.
from app.services.ai_service import AIService

# Router ya documents.
router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


# Endpoint ya ku-upload CV au certificate.
@router.post("/upload")
def upload_document(
    # Aina ya document tunayopokea.
    document_type: DocumentType = Form(...),

    # File inayotumwa na candidate.
    file: UploadFile = File(...),

    # Tunapata database session.
    db: Session = Depends(get_db),

    # Tunampata user kutoka kwenye JWT token.
    current_user: User = Depends(get_current_user)
):

    # Tunajaribu kuhifadhi document.
    try:

        # Tunaita DocumentService.
        document = DocumentService.upload_document(
            db=db,
            user_id=current_user.id,
            document_type=document_type,
            file=file
        )

        # Tunamrudishia taarifa za document.
        return {
            "message": "Document uploaded successfully",
            "document_id": document.id,
            "document_type": document.document_type,
            "file_name": document.file_name
        }

    # Kama file si sahihi.
    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

# Endpoint hii inasoma text kutoka kwenye document iliyohifadhiwa.
@router.get("/{document_id}/text")
def extract_document_text(
    # ID ya document tunayotaka kusoma.
    document_id: int,

    # Database session.
    db: Session = Depends(get_db),

    # Tunampata user kupitia JWT.
    current_user: User = Depends(get_current_user)
):

    # Tunatafuta document kwenye database.
    document = db.get(Document, document_id)

    # Kama document haipo.
    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # Tunahakikisha document ni ya user aliye-login.
    if document.user_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this document"
        )

    # Tunatoa text kutoka kwenye PDF.
    text = PDFService.extract_text(
        document.file_path
    )

    # Kama PDF haina text.
    if not text.strip():

        raise HTTPException(
            status_code=400,
            detail="No readable text found in this PDF"
        )

    # Tunamrudishia user text iliyotolewa kwenye PDF.
    return {
        "document_id": document.id,
        "document_type": document.document_type,
        "file_name": document.file_name,
        "text": text
    }

# Endpoint hii inapeleka text ya document kwenye AI analyzer.
@router.get("/{document_id}/analyze")
def analyze_document(

    # ID ya document tunayohitaji kuchambua.
    document_id: int,

    # Database session.
    db: Session = Depends(get_db),

    # Tunampata user aliye-login kupitia JWT.
    current_user: User = Depends(get_current_user)
):

    # Tunatafuta document kwenye database.
    document = db.get(Document, document_id)

    # Kama document haipo.
    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # Tunahakikisha document ni ya user aliye-login.
    if document.user_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this document"
        )

    # Tunatoa raw text kutoka kwenye PDF.
    text = PDFService.extract_text(
        document.file_path
    )

    # Kama hakuna text inayoweza kusomeka.
    if not text.strip():

        raise HTTPException(
            status_code=400,
            detail="No readable text found in this PDF"
        )

    # Tunapeleka text kwenye AI service.
    analysis = AIService.analyze_document(
        text=text
    )

    # Tunamrudishia analysis.
    return {
        "document_id": document.id,
        "document_type": document.document_type,
        "analysis": analysis
    }

# Endpoint hii inatengeneza swali la interview kutoka kwenye document.
@router.get("/{document_id}/interview-question")
def generate_interview_question(

    # ID ya CV/certificate.
    document_id: int,

    # Database session.
    db: Session = Depends(get_db),

    # User aliyeingia kwenye mfumo.
    current_user: User = Depends(get_current_user)
):

    # Tunatafuta document kwenye database.
    document = db.get(Document, document_id)

    # Kama document haipo.
    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # Tunahakikisha document ni ya user huyu.
    if document.user_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this document"
        )

    # Tunatoa text kutoka kwenye PDF.
    text = PDFService.extract_text(
        document.file_path
    )

    # Kama hakuna text.
    if not text.strip():

        raise HTTPException(
            status_code=400,
            detail="No readable text found in this document"
        )

    # Tunatuma document information kwa Gemini.
    question = AIService.generate_interview_question(
        candidate_information=text
    )

    # Tunamrudishia candidate swali.
    return {
        "document_id": document.id,
        "question": question
    }