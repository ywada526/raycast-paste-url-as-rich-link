import { BrowserExtension, Clipboard, confirmAlert, environment, open, showToast, Toast } from "@raycast/api";
import { escapeHTML, validateUrl } from "./utils";

export default async function pasteUrlAsRichLink() {
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

  const clipboardText = (await Clipboard.readText()) ?? "";
  const clipboardTextResult = validateUrl(clipboardText);
  if (!clipboardTextResult.ok) {
    console.error(clipboardTextResult.error.message);
    showToast({
      style: Toast.Style.Failure,
      title: `Invalid URL: ${clipboardText}`,
    });
    return;
  }
  const url = clipboardTextResult.url;

  const tabs = await BrowserExtension.getTabs();
  const title = tabs.find((tab) => tab.url === url.href)?.title;
  if (!title) {
    showToast({
      style: Toast.Style.Failure,
      title: `Failed to get page title: ${url.href}`,
    });
    return;
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
