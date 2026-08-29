export type SupportedOS = "windows" | "mac-arm64" | "mac-x64" | "linux-appimage" | "linux-deb";

export interface DownloadOption {
  id: SupportedOS;
  name: string;
  osName: string;
  arch: string;
  fileName: string;
  fileExt: string;
  badge: string;
  downloadUrl: string;
}

const REPO_OWNER = "Prince-695";
const REPO_NAME = "bee";
const RELEASE_VERSION = "0.1.0";
const GITHUB_RELEASE_BASE = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/v${RELEASE_VERSION}`;

export const DOWNLOAD_OPTIONS: Record<SupportedOS, DownloadOption> = {
  windows: {
    id: "windows",
    name: "Windows (x64)",
    osName: "Windows",
    arch: "64-bit (NSIS Installer)",
    fileName: `Bee-Setup-${RELEASE_VERSION}.exe`,
    fileExt: ".exe",
    badge: "EXE",
    downloadUrl: `${GITHUB_RELEASE_BASE}/Bee-Setup-${RELEASE_VERSION}.exe`,
  },
  "mac-arm64": {
    id: "mac-arm64",
    name: "macOS (Apple Silicon)",
    osName: "macOS",
    arch: "M1 / M2 / M3 / M4 (Apple Silicon)",
    fileName: `Bee-${RELEASE_VERSION}-arm64.dmg`,
    fileExt: ".dmg",
    badge: "DMG (ARM64)",
    downloadUrl: `${GITHUB_RELEASE_BASE}/Bee-${RELEASE_VERSION}-arm64.dmg`,
  },
  "mac-x64": {
    id: "mac-x64",
    name: "macOS (Intel)",
    osName: "macOS",
    arch: "Intel (x64)",
    fileName: `Bee-${RELEASE_VERSION}-x64.dmg`,
    fileExt: ".dmg",
    badge: "DMG (Intel)",
    downloadUrl: `${GITHUB_RELEASE_BASE}/Bee-${RELEASE_VERSION}-x64.dmg`,
  },
  "linux-appimage": {
    id: "linux-appimage",
    name: "Linux (AppImage)",
    osName: "Linux",
    arch: "Universal 64-bit AppImage",
    fileName: `Bee-${RELEASE_VERSION}.AppImage`,
    fileExt: ".AppImage",
    badge: "AppImage",
    downloadUrl: `${GITHUB_RELEASE_BASE}/Bee-${RELEASE_VERSION}.AppImage`,
  },
  "linux-deb": {
    id: "linux-deb",
    name: "Linux (Debian / Ubuntu)",
    osName: "Linux",
    arch: "Debian Package (.deb)",
    fileName: `bee_${RELEASE_VERSION}_amd64.deb`,
    fileExt: ".deb",
    badge: "DEB",
    downloadUrl: `${GITHUB_RELEASE_BASE}/bee_${RELEASE_VERSION}_amd64.deb`,
  },
};

export function detectUserOS(): DownloadOption {
  if (typeof window === "undefined" || !navigator) {
    return DOWNLOAD_OPTIONS["linux-appimage"];
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("win")) {
    return DOWNLOAD_OPTIONS["windows"];
  }

  if (userAgent.includes("mac")) {
    return DOWNLOAD_OPTIONS["mac-arm64"];
  }

  if (userAgent.includes("linux")) {
    if (userAgent.includes("ubuntu") || userAgent.includes("debian")) {
      return DOWNLOAD_OPTIONS["linux-deb"];
    }
    return DOWNLOAD_OPTIONS["linux-appimage"];
  }

  return DOWNLOAD_OPTIONS["windows"];
}

export function triggerDirectDownload(option: DownloadOption) {
  const link = document.createElement("a");
  link.href = option.downloadUrl;
  link.setAttribute("download", option.fileName);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
