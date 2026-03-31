import {
  BrowserExtension,
  Clipboard,
  confirmAlert,
  environment,
  getPreferenceValues,
  open,
  showToast,
  Toast,
} from "@raycast/api";
import { readFile } from "fs/promises";
import { basename } from "path";
import { fileURLToPath } from "url";
import { escapeHTML, validateUrl } from "./utils";

interface Preferences {
  gyazoAccessToken: string;
}

async function uploadToGyazo(filePath: string, accessToken: string): Promise<string> {
  const fileData = await readFile(filePath);
  const formData = new FormData();
  formData.append("access_token", accessToken);
  formData.append("imagedata", new Blob([fileData]), basename(filePath));

  const response = await fetch("https://upload.gyazo.com/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Gyazo upload failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export default async function pasteUrlAsRichLink() {
  const clipboardContent = await Clipboard.read();
  if (clipboardContent.file) {
    const { gyazoAccessToken } = getPreferenceValues<Preferences>();
    const filePath = clipboardContent.file.startsWith("file://")
      ? fileURLToPath(clipboardContent.file)
      : clipboardContent.file;

    showToast({
      style: Toast.Style.Animated,
      title: "Uploading image to Gyazo...",
    });

    const gyazoUrl = await uploadToGyazo(filePath, gyazoAccessToken);
    await Clipboard.paste(`![](${gyazoUrl})`);
    showToast({
      style: Toast.Style.Success,
      title: "Image uploaded and pasted",
    });
    return;
  }

  if (!environment.canAccess(BrowserExtension)) {
    await confirmAlert({
      title: "Raycast Browser Extension Required",
      message: "Please install the Raycast browser extension to use this command",
      primaryAction: {
        title: "Open Extension Page",
        onAction: async () => {
          await open("https://www.raycast.com/browser-extension");
        },
      },
    });
    return;
  }

  showToast({
    style: Toast.Style.Animated,
    title: "Getting link...",
  });

  const clipboardText = clipboardContent.text ?? "";
  const clipboardTextResult = validateUrl(clipboardText);
  if (!clipboardTextResult.ok) {
    throw new Error(`Invalid URL: ${clipboardText}`);
  }
  const url = clipboardTextResult.url;

  const tabs = await BrowserExtension.getTabs();
  const title = tabs.find((tab) => tab.url === url.href)?.title;
  if (!title) {
    throw new Error(`Failed to get page title: ${url.href}`);
  }

  const activeTabHostname = (() => {
    const activeTab = tabs.find((tab) => tab.active);
    if (!activeTab) return null;
    const result = validateUrl(activeTab.url);
    return result.ok ? result.url.hostname : null;
  })();

  switch (activeTabHostname) {
    case "github.com":
      Clipboard.paste({
        text: `[${title}](${url.href})`,
      });
      break;
    default:
      Clipboard.paste({
        text: `[${title}](${url.href})`,
        html: `<a href="${escapeHTML(url.href)}">${escapeHTML(title)}</a>`,
      });
  }
}
