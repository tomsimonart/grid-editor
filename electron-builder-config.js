const dotenv = require("dotenv");
dotenv.config();

function productNameExtension() {
  if (process.env.WORKFLOW_NAME == "nightly") {
    return ` (Nightly) ${process.env.BRANCH_NAME}`;
  } else if (process.env.WORKFLOW_NAME == "alpha") {
    return ` (Alpha) ${process.env.RELEASE_VERSION}`;
  }
}

const config = {
  asar: true,
  appId: "intechstudio.grid-editor.app",
  productName: "Grid Editor" + productNameExtension(),
  copyright: "Copyright © Intech Studio Ltd.",
  generateUpdatesFilesForAllChannels: true,
  directories: {
    output: "build/",
    buildResources: "build-assets"
  },
  protocols: [
    {
      name: "grid-editor-protocol",
      schemes: ["grid-editor", "grid-editor-dev"],
    },
  ],
  extraResources: [
    {
      from: "src/renderer/assets/**/*",
      to: "assets",
    },
  ],
  files: ["**/*"],
  win: {
    publish: [
      {
        provider: "github",
        owner: "intechstudio",
        repo: "grid-editor",
      },
    ],
    artifactName: "${name}-setup-${version}.${ext}",
    target: ["nsis"],
    icon: "build-assets/icon.png",
  },
  linux: {
    artifactName: "${name}-setup-${version}.${ext}",
  },
  mac: {
    target: [
      {
        target: "default",
        arch: ["arm64", "x64"],
      },
    ],
    artifactName: "${name}-setup-${version}-${arch}.${ext}",
    icon: "build-assets/icon_mac.png",
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "build-assets/entitlements.mac.plist",
    entitlementsInherit: "build-assets/entitlements.mac.plist",
    notarize: {
      teamId: process.env.APPLE_TEAM_ID,
    },
  },
  dmg: {
    sign: false,
  },
};

module.exports = config;
