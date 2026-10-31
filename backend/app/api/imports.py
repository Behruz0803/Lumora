"""Dataset transparency and real-price import endpoints.

``GET  /api/dataset/status`` - how much of the catalogue is real vs demo.
``GET  /api/import/template`` - a CSV template users can fill in and upload.
``POST /api/import/prices``  - import a supplier price list (CSV).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, response_language
from app.database.session import get_db
from app.schemas import DatasetStatus, ImportReport, Message
from app.services.dataset import dataset_status
from app.services.importer import ImportError_, import_prices

router = APIRouter(tags=["Data sources"])

TEMPLATE_HEADER = (
    "product,supplier,unit_price,delivery_cost,minimum_order_quantity,"
    "available_quantity,status,category,unit,phone,location\n"
)
TEMPLATE_SAMPLE = (
    "Potatoes,Tashkent Agro Trade,3900,40000,50,1200,in_stock,Vegetables,kg,"
    "+998 90 111 22 33,Tashkent\n"
    "Potatoes,Fergana Fresh Produce,3500,50000,50,800,in_stock,Vegetables,kg,"
    "+998 91 222 33 44,Fergana\n"
    "Onions,Bukhara Farm Direct,2600,25000,100,500,low_stock,Vegetables,kg,"
    "+998 65 333 44 55,Bukhara\n"
)

MAX_UPLOAD_BYTES = 2 * 1024 * 1024


@router.get(
    "/dataset/status",
    response_model=DatasetStatus,
    summary="How much of the dataset is real imported data versus seeded demo data",
)
def get_dataset_status(
    db: Session = Depends(get_db),
    language: str = Depends(response_language),
) -> DatasetStatus:
    return dataset_status(db, language)


@router.get(
    "/import/template",
    summary="Download an empty CSV price-list template",
    response_class=Response,
)
def download_template() -> Response:
    return Response(
        content=TEMPLATE_HEADER + TEMPLATE_SAMPLE,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="priceradar-price-list.csv"'},
    )


@router.post(
    "/import/prices",
    response_model=ImportReport,
    summary="Import real supplier prices from a CSV price list",
)
def import_price_list(
    file: UploadFile = File(..., description="CSV price list (UTF-8)"),
    dry_run: bool = Query(False, description="Validate only; nothing is saved"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    language: str = Depends(response_language),
) -> ImportReport:
    filename = (file.filename or "").lower()
    if not filename.endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a .csv file. Export your spreadsheet as CSV first.",
        )

    raw = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The file is larger than 2 MB. Split the price list into smaller files.",
        )
    if not raw.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The uploaded file is empty."
        )

    try:
        outcome = import_prices(db, raw, dry_run=dry_run, language=language)
    except ImportError_ as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))

    report = outcome.report
    report.warnings = outcome.warnings
    return report
