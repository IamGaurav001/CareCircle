"""Writes synthetic hospital documents to samples/ for demos and tests.

Every name, number and hospital here is made up. Never use real patient documents.
Usage: python3 scripts/make-samples.py
"""

from pathlib import Path


def pdf(lines: list[str]) -> bytes:
    """A one-page PDF of plain text lines, built without any library."""
    text = ["BT", "/F1 11 Tf", "14 TL", "56 790 Td"]
    for line in lines:
        escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        text.append(f"({escaped}) Tj T*")
    text.append("ET")
    stream = "\n".join(text).encode("latin-1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(out)


HEADER = [
    "SUNRISE TEST HOSPITAL (SYNTHETIC SAMPLE - NOT A REAL HOSPITAL)",
    "12 Example Road, Pune 411001",
    "",
]

SAMPLES = {
    "estimate-clean.pdf": HEADER
    + [
        "COST ESTIMATE                         Estimate no. EST-0001",
        "Patient: Test Patient (synthetic)     Procedure: Total knee replacement",
        "",
        "Item                                              Amount (INR)",
        "Surgeon fee                                          40,000.00",
        "Room charges (3 days, twin sharing)                  25,000.00",
        "Knee implant and medicines                           15,000.00",
        "------------------------------------------------------------",
        "TOTAL ESTIMATE                                       80,000.00",
        "",
        "This estimate is valid for 30 days.",
    ],
    "estimate-wrong-total.pdf": HEADER
    + [
        "COST ESTIMATE                         Estimate no. EST-0002",
        "Patient: Test Patient (synthetic)     Procedure: Appendectomy",
        "",
        "Item                                              Amount (INR)",
        "Consultation and tests                               20,000.00",
        "Laparoscopic procedure                               50,000.00",
        "------------------------------------------------------------",
        "TOTAL ESTIMATE                                       85,000.00",
    ],
    "receipt-matching.pdf": HEADER
    + [
        "PAYMENT RECEIPT                       Receipt no. RCP-0001",
        "Received from: CareCircle fund (sandbox)",
        "Towards: Total knee replacement, estimate EST-0001",
        "",
        "Item                                              Amount (INR)",
        "Surgeon fee                                          40,000.00",
        "Room charges                                         25,000.00",
        "Knee implant and medicines                           15,000.00",
        "------------------------------------------------------------",
        "TOTAL PAID                                           80,000.00",
    ],
    "receipt-unrelated.pdf": HEADER
    + [
        "PAYMENT RECEIPT                       Receipt no. RCP-0002",
        "Towards: Cosmetic dental whitening",
        "",
        "Item                                              Amount (INR)",
        "Teeth whitening session                              12,000.00",
        "------------------------------------------------------------",
        "TOTAL PAID                                           12,000.00",
    ],
}

if __name__ == "__main__":
    folder = Path("samples")
    folder.mkdir(exist_ok=True)
    for name, lines in SAMPLES.items():
        (folder / name).write_bytes(pdf(lines))
        print(f"wrote samples/{name}")
