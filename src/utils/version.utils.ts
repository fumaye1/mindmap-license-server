export type Semver = {
  major: number;
  minor: number;
  patch: number;
};

export function parseSemver(input: string): Semver | null {
  const raw = String(input ?? '').trim();
  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/);
  if (!match) return null;

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (!Number.isFinite(major) || !Number.isFinite(minor) || !Number.isFinite(patch)) return null;
  if (major < 0 || minor < 0 || patch < 0) return null;

  return { major, minor, patch };
}

export function compareSemver(a: Semver, b: Semver): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

export function isVersionAllowed(params: { current: string; max: string }): boolean {
  const current = parseSemver(params.current);
  const max = parseSemver(params.max);
  if (!current || !max) return false;
  return compareSemver(current, max) <= 0;
}

export function majorOf(version: string): number | null {
  const parsed = parseSemver(version);
  return parsed ? parsed.major : null;
}
