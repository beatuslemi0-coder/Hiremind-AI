from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.report import Report

class ReportRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        report_id: int
    ) -> Report | None:
        return db.get(Report, report_id)

    @staticmethod
    def get_by_interview(
        db: Session,
        interview_id: int
    ) -> Report | None:

        statement = select(Report).where(
            Report.interview_id == interview_id
        )

        return db.scalar(statement)

    @staticmethod
    def create(
        db: Session,
        report: Report
    ) -> Report:

        db.add(report)
        db.commit()
        db.refresh(report)

        return report