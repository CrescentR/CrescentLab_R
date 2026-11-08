#!/usr/bin/env bash
set -euo pipefail

[[ $EUID -eq 0 ]] || { echo "run as root" >&2; exit 1; }
[[ $# -eq 1 && -s $1 ]] || { echo "usage: $0 DEPLOY_PUBLIC_KEY_FILE" >&2; exit 64; }

readonly DEPLOY_USER=crescent-deploy
readonly REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi
passwd --lock "$DEPLOY_USER" >/dev/null

install -d -m 755 /etc/crescentlab
install -m 644 "$REPO_ROOT/deploy/compose.actions.yml" /etc/crescentlab/compose.actions.yml
install -m 755 "$REPO_ROOT/deploy/server/crescentlab-release" /usr/local/sbin/crescentlab-release
install -m 755 "$REPO_ROOT/deploy/server/crescentlab-release-dispatch" /usr/local/sbin/crescentlab-release-dispatch

install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 700 "/home/$DEPLOY_USER/.ssh"
{
  printf 'restrict,command="/usr/bin/sudo -n /usr/local/sbin/crescentlab-release-dispatch" '
  cat "$1"
} > "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

cat > /etc/sudoers.d/crescentlab-deploy <<EOF
$DEPLOY_USER ALL=(root) NOPASSWD: /usr/local/sbin/crescentlab-release-dispatch
EOF
chmod 440 /etc/sudoers.d/crescentlab-deploy
visudo -cf /etc/sudoers.d/crescentlab-deploy >/dev/null
