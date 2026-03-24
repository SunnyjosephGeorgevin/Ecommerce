import json
import importlib
import os
from datetime import datetime, timezone
from pathlib import Path


class LocalStorage:
    def __init__(self, base_dir: str) -> None:
        self.base_path = Path(base_dir)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def upload_json(self, object_name: str, payload: dict | list) -> str:
        target = self.base_path / object_name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return str(target)

    def read_json(self, object_name: str) -> dict | list | None:
        target = self.base_path / object_name
        if not target.exists():
            return None
        return json.loads(target.read_text(encoding="utf-8"))


class S3Storage:
    def __init__(self, bucket_name: str) -> None:
        boto3 = importlib.import_module("boto3")

        self.bucket_name = bucket_name
        self.client = boto3.client("s3")

    def upload_json(self, object_name: str, payload: dict | list) -> str:
        body = json.dumps(payload).encode("utf-8")
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=object_name,
            Body=body,
            ContentType="application/json",
        )
        return f"s3://{self.bucket_name}/{object_name}"

    def read_json(self, object_name: str) -> dict | list | None:
        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=object_name)
        except Exception:
            return None
        body = response["Body"].read().decode("utf-8")
        return json.loads(body)


def get_storage_backend():
    cloud_bucket = os.getenv("S3_BUCKET_NAME")
    if cloud_bucket:
        try:
            return S3Storage(cloud_bucket)
        except Exception:
            pass

    # Render and similar platforms always allow writes under /tmp.
    base_dir = os.getenv("LOCAL_STORAGE_PATH", "/tmp/ecommerce_storage")
    return LocalStorage(base_dir)


def build_export_object_name(prefix: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return f"{prefix}/{timestamp}.json"
