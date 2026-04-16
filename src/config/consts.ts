import { faBarsProgress, faBoxesStacked, faCode, faCubes, faDiagramProject, faTowerBroadcast, faFileExport, faHeadphones, faImage, faUsers, faVideo, faFingerprint, faShield } from "@fortawesome/free-solid-svg-icons";

export const dashboardDirectoryList = [
  { name: "Overview", icon: faDiagramProject, path: "dashboard/overview" },
  { name: "Members", icon: faUsers, path: "dashboard/members" },
  { name: "Exports", icon: faFileExport, path: "dashboard/exports" },
];

export const storageDirectoryList = [
  { name: "Images", icon: faImage, path: "images" },
  { name: "Audios", icon: faHeadphones, path: "audios" },
  { name: "Videos", icon: faVideo, path: "videos" },
  { name: "3D Models", icon: faCubes, path: "3d-models" },
];

export const databaseDirectoryList = [
  { name: "Collections", icon: faBoxesStacked, path: "database/collections" },
  { name: "Records", icon: faBarsProgress, path: "database/records" },
];

export const apiDirectoryList = [
  { name: "API", icon: faCode, path: "connections/api" },
];

export const settingsDirectoryList = [
  { name: "Credentials", icon: faFingerprint, path: "settings/credentials" },
  { name: "Permissions", icon: faShield, path: "settings/permissions" },
];