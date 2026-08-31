export type SupportedOS = "windows" | "mac-arm" | "mac-intel" | "linux-appimage" | "linux-deb";

export interface DownloadOption {
  id: SupportedOS;
  name: string;
  osName: string;
  arch: string;
  fileName: string;
  fileExt: string;
  directUrl: string;
  badge: string;
}

export const GITHUB_REPO = "Prince-695/Bee";
export const LATEST_VERSION = "0.1.0";
const RELEASE_BASE_URL = `https://github.com/${GITHUB_REPO}/releases/download/v${LATEST_VERSION}`;

export const DOWNLOAD_OPTIONS: Record<SupportedOS, DownloadOption> = {
  windows: {
    id: "windows",
    name: "Windows (x64 Installer)",
    osName: "Windows",
    arch: "x64",
    fileName: `Bee-Setup-${LATEST_VERSION}.exe`,
    fileExt: ".exe",
    directUrl: `${RELEASE_BASE_URL}/Bee-Setup-${LATEST_VERSION}.exe`,
    badge: "Installer",
  },
  "mac-arm": {
    id: "mac-arm",
    name: "macOS (Apple Silicon)",
    osName: "macOS",
    arch: "arm64",
    fileName: `Bee-${LATEST_VERSION}-arm64.dmg`,
    fileExt: ".dmg",
    directUrl: `${RELEASE_BASE_URL}/Bee-${LATEST_VERSION}-arm64.dmg`,
    badge: "Apple Silicon",
  },
  "mac-intel": {
    id: "mac-intel",
    name: "macOS (Intel x64)",
    osName: "macOS",
    arch: "x64",
    fileName: `Bee-${LATEST_VERSION}.dmg`,
    fileExt: ".dmg",
    directUrl: `${RELEASE_BASE_URL}/Bee-${LATEST_VERSION}.dmg`,
    badge: "Intel",
  },
  "linux-appimage": {
    id: "linux-appimage",
    name: "Linux (AppImage)",
    osName: "Linux",
    arch: "x86_64",
    fileName: `bee-${LATEST_VERSION}.AppImage`,
    fileExt: ".AppImage",
    directUrl: `${RELEASE_BASE_URL}/bee-${LATEST_VERSION}.AppImage`,
    badge: "Universal",
  },
  "linux-deb": {
    id: "linux-deb",
    name: "Linux (Debian / Ubuntu)",
    osName: "Linux",
    arch: "amd64",
    fileName: `bee_${LATEST_VERSION}_amd64.deb`,
    fileExt: ".deb",
    directUrl: `${RELEASE_BASE_URL}/bee_${LATEST_VERSION}_amd64.deb`,
    badge: "Debian",
  },
};

export function detectUserOS(): DownloadOption {
  if (typeof window === "undefined" || !navigator) {
    return DOWNLOAD_OPTIONS["windows"];
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = ((navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || "").toLowerCase();

  if (platform.includes("win") || userAgent.includes("windows")) {
    return DOWNLOAD_OPTIONS["windows"];
  }

  if (platform.includes("mac") || userAgent.includes("macintosh") || userAgent.includes("mac os")) {
    return DOWNLOAD_OPTIONS["mac-arm"];
  }

  if (platform.includes("linux") || userAgent.includes("linux")) {
    return DOWNLOAD_OPTIONS["linux-appimage"];
  }

  return DOWNLOAD_OPTIONS["windows"];
}

export function triggerDirectDownload(option: DownloadOption): void {
  const link = document.createElement("a");
  link.href = option.directUrl;
  link.setAttribute("download", option.fileName);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
