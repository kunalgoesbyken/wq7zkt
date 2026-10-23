from windesk.ingest.config import IngestSettings
from windesk.ingest.pipeline import run
from windesk.settings import get_settings


def main() -> None:
    manifest = run(get_settings(), IngestSettings())
    print(manifest.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
