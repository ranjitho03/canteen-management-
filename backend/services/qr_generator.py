from pathlib import Path

import qrcode


def generate_qr(table_id: int):
    output_dir = Path("static/qr_codes")
    output_dir.mkdir(parents=True, exist_ok=True)
    file_path = output_dir / f"table_{table_id}.png"
    img = qrcode.make(f"http://localhost:5173/menu?table={table_id}")
    img.save(file_path)
    return str(file_path)