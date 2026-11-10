"""Route the private HTTPS hostname through a rootless job's host gateway."""

from pathlib import Path
import socket
import urllib.request

hostname = "forgejo.kepr.dev"
gateway = socket.gethostbyname("host.containers.internal")
hosts = Path("/etc/hosts")
lines = []
for line in hosts.read_text().splitlines():
    body, marker, comment = line.partition("#")
    fields = body.split()
    if hostname in fields[1:]:
        fields = [fields[0], *(alias for alias in fields[1:] if alias != hostname)]
        if len(fields) == 1:
            continue
        line = "\t".join(fields)
        if marker:
            line += " #" + comment
    lines.append(line)
lines.append(f"{gateway}\t{hostname}\t# Forgejo private HTTPS route")
hosts.write_text("\n".join(lines) + "\n")

# Keep the canonical hostname and the client's normal certificate validation.
with urllib.request.urlopen(f"https://{hostname}/user/login", timeout=10) as response:
    if response.status != 200:
        raise RuntimeError("Private Forgejo HTTPS readiness check failed")
print("Private Forgejo HTTPS route ready")
