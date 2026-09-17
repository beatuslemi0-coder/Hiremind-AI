# Tuna-import APIRouter ili kuunganisha endpoints
# zote za API version 1 pamoja.
from fastapi import APIRouter

#Authentication endpoints
from app.api.v1.auth import router as auth_router

# Tuna-import router ya interviews tuliyoitengeneza.
from app.api.v1.interviews import router as interview_router

from app.api.v1.documents import router as document_router
# Tuna-import router ya Candidate Profile.
from app.api.v1.profile import router as profile_router
# Tuna-import router ya Candidate Education.
from app.api.v1.education import router as education_router
# Tuna-import router ya Work Experience.
from app.api.v1.work_experience import router as work_experience_router
from app.api.v1.jobs import router as jobs_router
# Tuna-import application router ili endpoints zake zipatikane kwenye API.
from app.api.v1.applications import router as applications_router




# Hii ndiyo main router ya API version 1.
router = APIRouter()

router.include_router(auth_router)


# Tunaunganisha endpoints zote za interviews
# kwenye main API router.
router.include_router(interview_router)

# Tunaunganisha document endpoints.
router.include_router(
    document_router
)

router.include_router(profile_router)
# Tunaunganisha education endpoints kwenye main API router.
router.include_router(education_router)
router.include_router(work_experience_router)
router.include_router(jobs_router)
router.include_router(applications_router)
