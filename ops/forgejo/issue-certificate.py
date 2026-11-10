"""Issue a DNS-01 certificate as the Forgejo owner; no privileged ports needed."""
from pathlib import Path
import subprocess

state = Path('/home/kk/.local/state/kk-forgejo-https')
state.mkdir(parents=True, exist_ok=True)
command = [
    str(state / 'venv/bin/certbot'), 'certonly', '--manual',
    '--preferred-challenges', 'dns', '--force-interactive', '--agree-tos',
    '--register-unsafely-without-email', '-d', 'forgejo.kepr.dev',
    '--config-dir', str(state / 'letsencrypt'),
    '--work-dir', str(state / 'work'), '--logs-dir', str(state / 'logs'),
]
with (state / 'certificate-output.log').open('w') as output:
    result = subprocess.run(command, stdout=output, stderr=subprocess.STDOUT)
raise SystemExit(result.returncode)
